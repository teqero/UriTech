import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
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

function getMeta(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

function parsePrice(raw?: string): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function enrich(title: string, description: string, price: number, platformLabel: string) {
  const clean = (s: string) => s.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  title = clean(title) || `Produto ${platformLabel}`;
  description = clean(description) || `Produto importado de ${platformLabel}.`;
  if (!price && description) price = parsePrice(description);
  return { title, description, price };
}

async function importFromUrl(url: string) {
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  const { platform, label } = detectPlatform(normalized);
  let html = '';
  try {
    const res = await fetch(normalized, {
      headers: { 'User-Agent': 'UriPayBot/1.0', Accept: 'text/html' },
      redirect: 'follow',
    });
    if (res.ok) html = (await res.text()).slice(0, 300_000);
  } catch { /* offline demo */ }

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  let title = getMeta(html, 'og:title') ?? titleTag ?? 'Produto importado';
  let description = getMeta(html, 'og:description') ?? getMeta(html, 'description') ?? '';
  let price = parsePrice(getMeta(html, 'og:price:amount') ?? getMeta(html, 'product:price:amount'));
  const image = getMeta(html, 'og:image');
  const images = image ? [image] : [];

  ({ title, description, price } = enrich(title, description, price, label));

  return {
    platform,
    platformLabel: label,
    originalUrl: normalized,
    title,
    description,
    price,
    currency: 'AOA',
    images,
    videos: [] as string[],
    sellerName: getMeta(html, 'og:site_name'),
    metadata: { platformLabel: label, completeness: price > 0 ? 85 : 50, aiEnriched: true },
  };
}

function mapRow(row: Record<string, unknown>) {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
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
    images: row.images ?? [],
    videos: row.videos ?? [],
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

export async function handleSocialPayments(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string | null,
) {
  if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };

  if (path === '/social-payments/import' && method === 'POST') {
    const { url } = await req.json();
    const imported = await importFromUrl(String(url ?? ''));
    const { data, error } = await supabase.from('social_payments').insert({
      buyer_id: userId,
      platform: imported.platform,
      original_url: imported.originalUrl,
      title: imported.title,
      description: imported.description,
      price: imported.price,
      currency: imported.currency,
      images: imported.images,
      videos: imported.videos,
      seller_name: imported.sellerName,
      status: 'imported',
      payment_status: 'pending',
      sync_status: 'pending',
      total: imported.price,
      metadata: imported.metadata,
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

    const { platform, label } = detectPlatform(String(record.original_url));
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
    const { data, error } = await supabase.from('social_payments').update({
      sync_status: 'synced',
      sync_message: 'Produto marcado como vendido.',
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();
    if (error) throw error;
    return { status: 200, body: mapRow(data) };
  }

  return null;
}
