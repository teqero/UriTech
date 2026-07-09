import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function routePath(url: URL): string {
  const raw = url.pathname.replace(/^\/uritech-api/, '');
  const idx = raw.indexOf('/api/v1');
  return idx >= 0 ? raw.slice(idx + '/api/v1'.length) || '/' : raw || '/';
}

function placeLabel(value: unknown): string {
  if (!value) return 'Luanda';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'address' in value) {
    const address = (value as { address?: string }).address;
    if (address) return address;
  }
  return JSON.stringify(value);
}

function mapRide(row: Record<string, unknown>) {
  const origin = row.origin as string | null;
  const destination = row.destination as string | null;
  return {
    id: row.id,
    userId: row.user_id,
    driverId: row.driver_id ?? undefined,
    status: row.status,
    mode: row.mode,
    pickup: { latitude: -8.8383, longitude: 13.2344, address: origin ?? 'Origem', city: 'Luanda', country: 'Angola' },
    destination: {
      latitude: -8.8583,
      longitude: 13.2312,
      address: destination ?? 'Destino',
      city: 'Luanda',
      country: 'Angola',
    },
    fare: Number(row.price ?? 0),
    distance: 5000,
    duration: 900,
    vehicleType: row.vehicle_type,
    createdAt: row.created_at,
  };
}

function resolveUserId(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '');
  const demoMatch = token.match(/^demo-(.+)$/);
  if (demoMatch) return demoMatch[1];
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const path = routePath(new URL(req.url));
  const method = req.method;

  try {
    if (path === '/settings/brand' && method === 'GET') {
      const { data, error } = await supabase.from('brand_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return json(mapBrand(data));
    }

    if (path === '/settings/brand' && method === 'PUT') {
      const body = await req.json();
      const { data, error } = await supabase.from('brand_settings').update(mapBrandToDb(body)).eq('id', 1).select().single();
      if (error) throw error;
      return json(mapBrand(data));
    }

    if (path === '/settings/integrations' && method === 'GET') {
      const type = new URL(req.url).searchParams.get('type');
      let q = supabase.from('api_integrations').select('*').order('name');
      if (type) q = q.eq('type', type);
      const { data, error } = await q;
      if (error) throw error;
      return json((data ?? []).map(mapIntegration));
    }

    if (path === '/services' && method === 'GET') {
      return json(SERVICES);
    }

    if (path === '/services/promos' && method === 'GET') {
      return json(PROMOS);
    }

    if (path.startsWith('/rides/') && method === 'GET') {
      const id = path.split('/')[2];
      const { data, error } = await supabase.from('rides').select('*').eq('id', id).single();
      if (error) return json({ message: 'Corrida não encontrada' }, 404);
      return json(mapRide(data));
    }

    if (path === '/rides' && method === 'GET') {
      const { data, error } = await supabase.from('rides').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return json((data ?? []).map(mapRide));
    }

    if (path === '/rides' && method === 'POST') {
      const body = await req.json();
      let userId = resolveUserId(req);
      if (!userId && body.userId) userId = body.userId;

      if (!userId) {
        const { data: fallback } = await supabase
          .from('users')
          .select('id')
          .eq('email', 'joao@uritech.com')
          .single();
        userId = fallback?.id ?? null;
      }

      if (!userId) return json({ message: 'Utilizador não autenticado' }, 401);

      const row = {
        user_id: userId,
        status: 'searching',
        mode: body.mode ?? 'fixed',
        vehicle_type: body.vehicleType ?? body.vehicle_type ?? 'standard',
        origin: placeLabel(body.pickup ?? body.origin),
        destination: placeLabel(body.destination),
        price: body.fare ?? body.price ?? 0,
      };

      const { data, error } = await supabase.from('rides').insert(row).select().single();
      if (error) throw error;
      return json(mapRide(data), 201);
    }

    if (path === '/orders' && method === 'GET') {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return json(data ?? []);
    }

    if (path === '/drivers' && method === 'GET') {
      const { data, error } = await supabase.from('drivers').select('*').limit(50);
      if (error) throw error;
      return json(data ?? []);
    }

    if (path === '/vendors' && method === 'GET') {
      const { data, error } = await supabase.from('vendors').select('*').limit(50);
      if (error) throw error;
      return json(data ?? []);
    }

    if (path === '/auth/login' && method === 'POST') {
      const { email } = await req.json();
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error || !user) return json({ message: 'Credenciais inválidas' }, 401);

      return json({
        access_token: `demo-${user.id}`,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    return json({ message: `Route not found: ${path}` }, 404);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error(e);
    return json({ message }, 500);
  }
});

function mapBrand(row: Record<string, unknown>) {
  return {
    appName: row.app_name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    primaryColor: row.primary_color,
    primaryDark: row.primary_dark,
    primaryLight: row.primary_light,
    secondaryColor: row.secondary_color,
    fontFamily: row.font_family,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    defaultCity: row.default_city,
    defaultCountry: row.default_country,
    currencySymbol: row.currency_symbol,
  };
}

function mapBrandToDb(body: Record<string, unknown>) {
  const m: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.appName !== undefined) m.app_name = body.appName;
  if (body.tagline !== undefined) m.tagline = body.tagline;
  if (body.logoUrl !== undefined) m.logo_url = body.logoUrl;
  if (body.faviconUrl !== undefined) m.favicon_url = body.faviconUrl;
  if (body.primaryColor !== undefined) m.primary_color = body.primaryColor;
  if (body.primaryDark !== undefined) m.primary_dark = body.primaryDark;
  if (body.primaryLight !== undefined) m.primary_light = body.primaryLight;
  if (body.secondaryColor !== undefined) m.secondary_color = body.secondaryColor;
  if (body.fontFamily !== undefined) m.font_family = body.fontFamily;
  if (body.supportEmail !== undefined) m.support_email = body.supportEmail;
  if (body.supportPhone !== undefined) m.support_phone = body.supportPhone;
  if (body.defaultCity !== undefined) m.default_city = body.defaultCity;
  if (body.defaultCountry !== undefined) m.default_country = body.defaultCountry;
  if (body.currencySymbol !== undefined) m.currency_symbol = body.currencySymbol;
  return m;
}

function mapIntegration(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    provider: row.provider,
    apiKey: row.api_key,
    apiSecret: row.api_secret,
    webhookUrl: row.webhook_url,
    merchantId: row.merchant_id,
    environment: row.environment,
    status: row.status,
    enabled: row.enabled,
    config: row.config,
    updatedAt: row.updated_at,
  };
}

const SERVICES = [
  { id: '1', type: 'taxi', name: 'Taxi', icon: '🚕', color: '#00AA13', description: 'Transporte rápido e seguro', route: '/taxi' },
  { id: '2', type: 'envio', name: 'Envio', icon: '📦', color: '#0081A0', description: 'Envio de encomendas', route: '/envio' },
];

const PROMOS = [
  { id: '1', title: 'Desconto no Taxi', subtitle: 'Use o código TAXI24 para 20% off', backgroundColor: '#00AA13' },
];
