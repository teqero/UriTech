import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleSocialPayments } from './social-payments.ts';
import { handleWalletRoutes, handlePaymentRoutes } from './wallet-routes.ts';
import { handleOrderRoutes } from './orders-routes.ts';
import { handleRideRoutes } from './rides-routes.ts';
import { handleExtrasRoutes } from './extras-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-request-id, x-urigo-client, x-urigo-channel',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'x-request-id',
};

let activeRequestId: string | undefined;

function responseHeaders(contentType?: string): Record<string, string> {
  const h: Record<string, string> = { ...corsHeaders };
  if (contentType) h['Content-Type'] = contentType;
  if (activeRequestId) h['X-Request-Id'] = activeRequestId;
  return h;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders('application/json'),
  });
}

function withRequestId(res: Response): Response {
  if (!activeRequestId) return res;
  const headers = new Headers(res.headers);
  headers.set('X-Request-Id', activeRequestId);
  for (const [k, v] of Object.entries(corsHeaders)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function routePath(url: URL): string {
  const raw = url.pathname.replace(/^\/uritech-api/, '');
  const idx = raw.indexOf('/api/v1');
  let path = idx >= 0 ? raw.slice(idx + '/api/v1'.length) || '/' : raw || '/';
  while (path.startsWith('/api/v1')) {
    path = path.slice('/api/v1'.length) || '/';
  }
  return path;
}

function resolveUserId(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '');
  const demoMatch = token.match(/^demo-(.+)$/);
  if (demoMatch) return demoMatch[1];
  return null;
}

async function dispatch(
  result: { status: number; body: unknown; raw?: Response } | null,
): Promise<Response | null> {
  if (!result) return null;
  if (result.raw instanceof Response) return withRequestId(result.raw);
  return json(result.body, result.status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  activeRequestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const path = routePath(new URL(req.url));
  const method = req.method;
  const userId = resolveUserId(req);

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
      const body = await req.json();
      const email = String(body.email ?? '');
      const password = String(body.password ?? '');
      if (!email) return json({ message: 'Email obrigatório' }, 400);
      if (password && password !== 'demo123') {
        return json({ message: 'Credenciais inválidas' }, 401);
      }

      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error || !user) return json({ message: 'Credenciais inválidas' }, 401);

      return json({
        access_token: `demo-${user.id}`,
        refresh_token: `refresh-${user.id}`,
        user: {
          id: user.id,
          firstName: user.first_name ?? user.name?.split(' ')[0],
          lastName: user.last_name ?? user.name?.split(' ').slice(1).join(' '),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    const extras = await handleExtrasRoutes(supabase, method, path, req, userId);
    const extrasRes = await dispatch(extras);
    if (extrasRes) return extrasRes;

    if (path.startsWith('/rides')) {
      const rides = await handleRideRoutes(supabase, method, path, req, userId);
      const ridesRes = await dispatch(rides);
      if (ridesRes) return ridesRes;
    }

    if (path.startsWith('/orders')) {
      const orders = await handleOrderRoutes(supabase, method, path, req, userId);
      const ordersRes = await dispatch(orders);
      if (ordersRes) return ordersRes;
    }

    if (path.startsWith('/wallet') || path.startsWith('/payments/')) {
      if (!userId) return json({ message: 'Utilizador não autenticado' }, 401);
      const wallet = await handleWalletRoutes(supabase, method, path, req, userId);
      const walletRes = await dispatch(wallet);
      if (walletRes) return walletRes;
      const payments = await handlePaymentRoutes(supabase, method, path, req, userId);
      const payRes = await dispatch(payments);
      if (payRes) return payRes;
    }

    if (path.startsWith('/social-payments')) {
      const result = await handleSocialPayments(supabase, method, path, req, userId);
      if (result) {
        if ('raw' in result && result.raw instanceof Response) return withRequestId(result.raw);
        return json(result.body, result.status);
      }
    }

    return json({ message: `Route not found: ${path}`, requestId: activeRequestId }, 404);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error(`[${activeRequestId}]`, e);
    return json({ message, requestId: activeRequestId }, 500);
  } finally {
    activeRequestId = undefined;
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