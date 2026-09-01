import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { importFromUrl } from './social-import.ts';
import { walletPay } from './wallet.ts';

const SERVICE_FEE_RATE = 0.025;
const DELIVERY_FEES: Record<string, number> = { pickup: 0, urigo: 1500, none: 0 };

function detectPlatform(url: string) {
  const rules: [RegExp, string, string][] = [
    [/facebook\.com|fb\.com|fb\.me/i, 'facebook', 'Facebook Marketplace'],
    [/instagram\.com/i, 'instagram', 'Instagram'],
    [/tiktok\.com/i, 'tiktok', 'TikTok Shop'],
    [/wa\.me|whatsapp\.com/i, 'whatsapp', 'WhatsApp Business'],
    [/olx\./i, 'olx', 'OLX'],
    [/mercadolivre|mercadolibre/i, 'mercadolivre', 'Mercado Livre'],
    [/ebay\./i, 'ebay', 'eBay'],
    [/aliexpress/i, 'aliexpress', 'AliExpress'],
    [/alibaba/i, 'alibaba', 'Alibaba'],
    [/pinterest/i, 'pinterest', 'Pinterest'],
    [/linkedin/i, 'linkedin', 'LinkedIn'],
  ];
  try {
    const host = new URL(url).hostname;
    for (const [re, platform, label] of rules) {
      if (re.test(host) || re.test(url)) return { platform, label };
    }
  } catch { /* */ }
  return { platform: 'other', label: 'Rede Social' };
}

function mapRow(row: Record<string, unknown>) {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    platform: row.platform,
    originalUrl: row.original_url,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    category: row.category,
    condition: row.condition,
    brand: row.brand,
    city: row.city,
    country: row.country,
    images,
    videos: Array.isArray(row.videos) ? row.videos : [],
    sellerName: row.seller_name,
    status: row.status,
    paymentStatus: row.payment_status,
    transactionId: row.transaction_id,
    checkoutId: row.checkout_id,
    orderId: row.order_id,
    syncStatus: row.sync_status,
    syncMessage: row.sync_message,
    quantity: row.quantity,
    deliveryFee: Number(row.delivery_fee),
    serviceFee: Number(row.service_fee),
    discount: Number(row.discount),
    total: Number(row.total),
    metadata: meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function calcCheckout(record: Record<string, unknown>, body: Record<string, unknown>) {
  const quantity = Number(body.quantity ?? record.quantity ?? 1);
  const deliveryKey = String(body.deliveryOption ?? 'urigo');
  const deliveryFee = DELIVERY_FEES[deliveryKey] ?? 1500;
  const subtotal = Number(record.price) * quantity;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const discount = String(body.couponCode ?? '').toUpperCase() === 'URIGO10' ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);
  return { quantity, deliveryFee, serviceFee, discount, total };
}

function importedToDb(imported: Awaited<ReturnType<typeof importFromUrl>>) {
  return {
    platform: imported.platform,
    original_url: imported.originalUrl,
    title: imported.title,
    description: imported.description,
    price: imported.price,
    currency: imported.currency,
    category: imported.category ?? null,
    condition: imported.condition ?? null,
    brand: imported.brand ?? null,
    city: imported.city ?? null,
    country: imported.country ?? null,
    images: imported.images,
    videos: imported.videos,
    seller_name: imported.sellerName ?? null,
    total: imported.price,
    metadata: imported.metadata,
  };
}

export async function handleSocialPayments(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string | null,
) {
  if (path === '/social-payments/image' && method === 'GET') {
    const imageUrl = new URL(req.url).searchParams.get('url');
    if (!imageUrl?.startsWith('http')) {
      return { status: 400, body: { message: 'URL de imagem inválida' } };
    }
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          Accept: 'image/*,*/*',
          Referer: new URL(imageUrl).origin,
        },
        redirect: 'follow',
      });
      if (!res.ok) return { status: 404, body: { message: 'Imagem não disponível' } };
      const contentType = res.headers.get('content-type') ?? 'image/jpeg';
      const bytes = await res.arrayBuffer();
      return {
        status: 200,
        raw: new Response(bytes, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        }),
      };
    } catch {
      return { status: 502, body: { message: 'Não foi possível carregar a imagem' } };
    }
  }

  if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };

  if (path === '/social-payments/import' && method === 'POST') {
    const { url } = await req.json();
    const imported = await importFromUrl(String(url ?? ''));
    const { data, error } = await supabase.from('social_payments').insert({
      buyer_id: userId,
      ...importedToDb(imported),
      status: 'imported',
      payment_status: 'pending',
      sync_status: 'pending',
    }).select().single();
    if (error) throw error;
    return { status: 201, body: mapRow(data) };
  }

  if (path === '/social-payments' && method === 'GET') {
    const { data, error } = await supabase.from('social_payments').select('*').eq('buyer_id', userId).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return { status: 200, body: (data ?? []).map(mapRow) };
  }

  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'social-payments' || !parts[1]) return null;
  const id = parts[1];
  const action = parts[2];

  const { data: record, error: findErr } = await supabase.from('social_payments').select('*').eq('id', id).eq('buyer_id', userId).single();
  if (findErr || !record) return { status: 404, body: { message: 'Pagamento não encontrado' } };

  if (!action && method === 'GET') {
    return { status: 200, body: mapRow(record) };
  }

  if (action === 'checkout' && method === 'POST') {
    const body = await req.json();
    const calc = calcCheckout(record, body);
    const { data, error } = await supabase.from('social_payments').update({
      status: 'checkout',
      quantity: calc.quantity,
      delivery_fee: calc.deliveryFee,
      service_fee: calc.serviceFee,
      discount: calc.discount,
      total: calc.total,
      checkout_id: `CHK-${id.slice(0, 8).toUpperCase()}`,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return { status: 200, body: mapRow(data) };
  }

  if (action === 'pay' && method === 'POST') {
    const body = await req.json();
    const calc = calcCheckout(record, body);
    const amount = calc.total > 0 ? calc.total : Number(record.price) * calc.quantity;
    if (amount <= 0) return { status: 400, body: { message: 'Preço do produto não identificado' } };

    const txCode = `SP-${Date.now().toString(36).toUpperCase()}`;
    if (body.payWithWallet !== false) {
      await walletPay(supabase, userId, amount, `UriPay Link — ${String(record.title).slice(0, 80)}`);
    }

    const { label } = detectPlatform(String(record.original_url));
    const syncMessage = `Recebemos o pagamento deste produto. Abra o anúncio em ${label} e marque-o como vendido.`;

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      user_id: userId,
      service_type: 'pay',
      status: 'confirmed',
      items: [{ menuItemId: id, name: record.title, quantity: calc.quantity, price: record.price }],
      total: amount,
      delivery_fee: calc.deliveryFee,
      pickup_location: { address: label, latitude: -8.8383, longitude: 13.2344 },
      delivery_location: { address: record.city ?? 'Entrega UriPay', latitude: -8.8383, longitude: 13.2344 },
    }).select().single();
    if (orderErr) throw orderErr;

    const { data: paid, error: payErr } = await supabase.from('social_payments').update({
      status: 'paid',
      payment_status: 'paid',
      transaction_id: txCode,
      order_id: order.id,
      quantity: calc.quantity,
      delivery_fee: calc.deliveryFee,
      service_fee: calc.serviceFee,
      discount: calc.discount,
      total: amount,
      sync_status: 'manual_required',
      sync_message: syncMessage,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (payErr) throw payErr;

    const { data: buyer } = await supabase.from('users').select('first_name, last_name').eq('id', userId).single();
    const buyerName = buyer ? `${buyer.first_name} ${buyer.last_name}`.trim() : 'Comprador UriPay';

    return {
      status: 200,
      body: {
        payment: mapRow(paid),
        receiptCode: txCode,
        buyerName,
        paidAt: new Date().toISOString(),
      },
    };
  }

  if (action === 'sync' && method === 'POST') {
    const imported = await importFromUrl(String(record.original_url));
    const { data, error } = await supabase.from('social_payments').update({
      ...importedToDb(imported),
      sync_status: 'pending',
      sync_message: 'Metadados actualizados a partir do anúncio.',
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return { status: 200, body: mapRow(data) };
  }

  return null;
}
