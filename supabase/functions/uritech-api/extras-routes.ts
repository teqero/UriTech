import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { authModeInfo } from './auth-routes.ts';

function claimRef(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `URI-CLM-${n}`;
}

function integrityHash(parts: string[]): string {
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `UP-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

const DEMO_INSURERS_ROWS = [
  {
    id: 'ins-1',
    name: 'ENSA — Empresa Nacional de Seguros',
    code: 'ENSA',
    contact_email: 'sinistros@ensa.co.ao',
    contact_phone: '+244 222 000 111',
    api_webhook_url: 'https://api.ensa.co.ao/uriprova/webhook',
    platform_fee_per_claim: 2500,
    platform_fee_monthly: 150000,
    active: true,
    mandated_for_clients: true,
    clients_count: 12400,
    claims_this_month: 89,
  },
  {
    id: 'ins-2',
    name: 'Nossa Seguros',
    code: 'NOSSA',
    contact_email: 'claims@nossaseguros.ao',
    contact_phone: '+244 222 000 222',
    platform_fee_per_claim: 2200,
    platform_fee_monthly: 120000,
    active: true,
    mandated_for_clients: true,
    clients_count: 8200,
    claims_this_month: 54,
  },
  {
    id: 'ins-3',
    name: 'Global Seguros',
    code: 'GLOBAL',
    contact_email: 'sinistros@globalseguros.ao',
    contact_phone: '+244 222 000 333',
    platform_fee_per_claim: 2000,
    platform_fee_monthly: 95000,
    active: true,
    mandated_for_clients: false,
    clients_count: 5100,
    claims_this_month: 31,
  },
];

function mapInsurer(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    active: row.active,
    mandatedForClients: row.mandated_for_clients,
    clientsCount: row.clients_count,
    claimsThisMonth: row.claims_this_month,
    createdAt: row.created_at,
  };
}

function mapClaim(row: Record<string, unknown>) {
  return {
    id: row.id,
    reference: row.reference,
    insurerId: row.insurer_id,
    insurerName: row.insurer_name,
    policyNumber: row.policy_number,
    insuredName: row.insured_name,
    insuredPhone: row.insured_phone,
    incidentType: row.incident_type,
    incidentDescription: row.incident_description,
    location: row.location,
    media: row.media,
    status: row.status,
    integrityHash: row.integrity_hash,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

export async function handleExtrasRoutes(
  supabase: SupabaseClient,
  method: string,
  path: string,
  req: Request,
  userId: string | null,
): Promise<{ status: number; body: unknown } | null> {
  const url = new URL(req.url);

  if (path === '/health' && method === 'GET') {
    const started = performance.now();
    const { error } = await supabase.from('brand_settings').select('id').limit(1).maybeSingle();
    const dbMs = Math.round(performance.now() - started);
    return {
      status: error ? 503 : 200,
      body: {
        status: error ? 'degraded' : 'ok',
        service: 'uritech-api',
        version: '1.0.0',
        ts: new Date().toISOString(),
        checks: {
          database: error ? { status: 'down', message: error.message, responseTimeMs: dbMs } : { status: 'up', responseTimeMs: dbMs },
        },
        auth: authModeInfo(),
      },
    };
  }

  if (path === '/telemetry/client-error' && method === 'POST') {
    const body = await req.json().catch(() => ({}));
    console.warn('[client-error]', JSON.stringify({ userId, ...body }).slice(0, 4000));
    return { status: 200, body: { received: true } };
  }

  if (path === '/insurers' && method === 'GET') {
    const active = url.searchParams.get('active');
    let q = supabase.from('insurers').select('*', { count: 'exact', head: false }).order('name');
    if (active === 'true') q = q.eq('active', true);
    let { data, error, count } = await q;
    if (error) throw error;
    if ((count ?? data?.length ?? 0) === 0) {
      await supabase.from('insurers').upsert(DEMO_INSURERS_ROWS, { onConflict: 'id' });
      const again = await q;
      data = again.data;
      error = again.error;
      if (error) throw error;
    }
    return { status: 200, body: (data ?? []).map(mapInsurer) };
  }

  if (path === '/auth/logout' && method === 'POST') {
    return { status: 200, body: { ok: true } };
  }

  if (path === '/claim-evidence' && method === 'POST') {
    const body = await req.json();
    const insurerId = String(body.insurerId ?? '');
    const { data: insurer, error: insErr } = await supabase.from('insurers').select('*').eq('id', insurerId).single();
    if (insErr || !insurer) return { status: 404, body: { message: 'Seguradora não encontrada' } };
    if (!insurer.active) return { status: 400, body: { message: 'Seguradora inactiva' } };
    if (!Array.isArray(body.media) || body.media.length === 0) {
      return { status: 400, body: { message: 'Inclua pelo menos uma evidência' } };
    }

    const reference = claimRef();
    const id = crypto.randomUUID();
    const hash = integrityHash([reference, insurerId, String(body.policyNumber), String(body.insuredName)]);
    const now = new Date().toISOString();
    const row = {
      id,
      reference,
      insurer_id: insurerId,
      insurer_name: insurer.name,
      policy_number: String(body.policyNumber),
      insured_name: String(body.insuredName),
      insured_phone: String(body.insuredPhone),
      incident_type: String(body.incidentType),
      incident_description: body.incidentDescription ? String(body.incidentDescription) : null,
      location: body.location,
      media: body.media,
      status: 'submitted',
      integrity_hash: hash,
      submitted_at: now,
    };
    const { data, error } = await supabase.from('claim_evidence').insert(row).select().single();
    if (error) throw error;
    return {
      status: 201,
      body: {
        report: mapClaim(data),
        message: 'Dossiê UriProva submetido com sucesso',
      },
    };
  }

  if (path === '/upload/presigned' && method === 'POST') {
    if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };
    const body = await req.json();
    const key = String(body.key ?? `uploads/${userId}/${Date.now()}`);
    const bucket = String(body.bucket ?? Deno.env.get('UPLOAD_BUCKET') ?? 'uritech-uploads');
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key);
    if (error) {
      const base = Deno.env.get('SUPABASE_URL') ?? '';
      const publicUrl = `${base}/storage/v1/object/public/${bucket}/${key}`;
      return {
        status: 200,
        body: {
          url: publicUrl,
          key,
          bucket,
          publicUrl,
          fallback: true,
        },
      };
    }
    const publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${key}`;
    return {
      status: 200,
      body: {
        url: data.signedUrl,
        key,
        bucket,
        publicUrl: data.path ? `${Deno.env.get('SUPABASE_URL')}/storage/v1${data.path}` : publicUrl,
      },
    };
  }

  if (path === '/notifications/register' && method === 'POST') {
    if (!userId) return { status: 401, body: { message: 'Utilizador não autenticado' } };
    const body = await req.json();
    const token = String(body.token ?? '');
    if (!token) return { status: 400, body: { message: 'Token em falta' } };
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: String(body.platform ?? 'unknown'),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );
    return { status: 200, body: { ok: true } };
  }

  return null;
}