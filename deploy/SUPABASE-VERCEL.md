# Deploy UriTech — Supabase + Vercel

## Supabase (produção)

| Item | Valor |
|------|-------|
| Projeto | SecurePay (`akyzbuvdokdrjpuzhocg`) |
| Dashboard | https://supabase.com/dashboard/project/akyzbuvdokdrjpuzhocg |
| URL | `https://akyzbuvdokdrjpuzhocg.supabase.co` |
| API (Edge Function) | `https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1` |

### O que está deployado

- **Schema Postgres**: `brand_settings`, `api_integrations`, `users`, `drivers`, `vendors`, `orders`, `rides` + RLS
- **Edge Function** `uritech-api`: espelha endpoints do backend NestJS (`/settings/brand`, `/services`, `/rides`, etc.)

### Testar API

```bash
curl "https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1/settings/brand" \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

---

## Vercel (frontends)

### Variáveis de ambiente (ambos os apps)

```
NEXT_PUBLIC_API_URL=https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://akyzbuvdokdrjpuzhocg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do dashboard Supabase>
```

### URLs de produção (activas)

| App | URL |
|-----|-----|
| **Web User** | https://web-user-sooty.vercel.app |
| **Web Admin** | https://web-admin-three-xi.vercel.app |
| **Dashboard Vercel** | https://vercel.com/teqeros-projects |

### Deploy manual (a partir da raiz do monorepo)

```bash
# Web User
npx vercel link --project web-user --yes
npx vercel deploy --prod --yes --local-config apps/web-user/vercel.json

# Web Admin
npx vercel link --project web-admin --yes
npx vercel deploy --prod --yes --local-config apps/web-admin/vercel.json
```

As variáveis de ambiente já estão configuradas nos projetos Vercel. Cada app tem `vercel.json` com build do monorepo (`npm ci` na raiz + build do workspace).

### Mobile (Expo)

```
EXPO_PUBLIC_API_URL=https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1
```

---

## Próximos passos (opcional)

1. Renomear projeto Supabase "SecurePay" → "UriTech" no dashboard
2. Domínio customizado no Vercel (ex: `app.urigo.ao`, `admin.urigo.ao`)
3. Migrar backend NestJS completo para Postgres ou expandir Edge Functions
4. Habilitar `verify_jwt` na Edge Function com auth real
