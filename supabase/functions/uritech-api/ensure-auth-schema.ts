/** Garante coluna users.password (alguns restores Supabase ficaram sem ela no schema PostgREST). */

let ensured = false;

export async function ensureAuthSchema(): Promise<void> {
  if (ensured) return;

  const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? Deno.env.get('POSTGRES_URL') ?? '';
  if (!dbUrl) {
    console.warn('[auth-schema] SUPABASE_DB_URL em falta — skip DDL');
    return;
  }

  try {
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.5/mod.js');
    const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 });
    await sql`
      alter table public.users
      add column if not exists password varchar(255) not null default ''
    `;
    await sql`
      notify pgrst, 'reload schema'
    `;
    await sql.end({ timeout: 5 });
    ensured = true;
    console.log('[auth-schema] users.password OK');
  } catch (e) {
    console.error('[auth-schema]', e instanceof Error ? e.message : e);
  }
}
