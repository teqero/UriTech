# Ownership de rotas — Edge BFF vs Nest

Uma fonte de verdade por path. O mobile usa o mesmo sufixo relativo sob `{BASE}/api/v1`.

| Ambiente | Base URL |
|----------|----------|
| Produção actual (edge) | `…/functions/v1/uritech-api/api/v1` |
| Staging Nest (local) | `http://localhost:4001/api/v1` |
| Produção Nest (futuro) | `https://api.urigo.ao/api/v1` |

## Legenda

| Owner | Significado |
|-------|-------------|
| **Nest** | Fonte de verdade canónica (Sprint B+) |
| **Edge** | BFF/compat até cutover; espelha contratos Nest nos P0 |
| **Both** | Mesmo contrato; Nest é canónico, Edge mantido para prod actual |
| **Edge-only** | Fica na edge até migrar (não bloqueia P0 Nest) |
| **Nest-only** | Só Nest (admin, webhooks, auth avançado) |

## P0 — path → owner

| Método | Path | Owner | Notas |
|--------|------|-------|-------|
| GET | `/health` | Both | Nest + Edge |
| POST | `/auth/login` | Both | Nest JWT; Edge `demo-{id}` + bcrypt |
| POST | `/auth/refresh` | Both | Shared `normalizeAuthSession` |
| POST | `/auth/logout` | Nest | Edge não expõe |
| POST | `/auth/register` | Nest | Edge não expõe |
| GET | `/wallet` | Both | Nest exige JWT |
| GET | `/wallet/transactions` | Both | |
| POST | `/wallet/topup` | Both | |
| POST | `/wallet/transfer` | Both | |
| POST | `/wallet/withdraw` | Both | |
| POST | `/wallet/pay` | Nest-only | Escrow interno |
| POST | `/payments/multicaixa/initiate` | Both | |
| POST | `/payments/multicaixa/simulate` | Both | Nest bloqueia em `production` |
| POST | `/payments/multicaixa/webhook` | Nest-only | LAUNCH-01 |
| GET | `/orders` | Both | |
| GET | `/orders/:id` | Both | Nest `@Public` |
| POST | `/orders/checkout` | Both | Nest: role `user` |
| POST | `/orders/service-checkout` | Both | Nest: role `user` |
| PATCH | `/orders/:id/status` | Both | |
| GET | `/rides` | Both | |
| GET | `/rides/:id` | Both | |
| POST | `/rides` | Both | Nest: JWT + débito wallet |
| PATCH | `/rides/:id/status` | Both | |
| POST | `/social-payments/import` | Both | |
| GET | `/social-payments` | Both | |
| GET | `/social-payments/image` | Both | Proxy público OG |
| GET | `/social-payments/:id` | Both | |
| PATCH | `/social-payments/:id` | Both | Edição manual título/preço |
| POST | `/social-payments/:id/checkout` | Both | |
| POST | `/social-payments/:id/pay` | Both | Nest: **escrow hold** + order; Edge: ainda `payment` até paridade |
| POST | `/social-payments/:id/sync` | Both | Nest re-importa URL (paridade Edge) |
| GET | `/insurers` | Both | Nest seed + Edge |
| POST | `/claim-evidence` | Both | Nest + MinIO; Edge Supabase |
| GET | `/claim-evidence/reference/:ref` | Nest | Lookup por referência |
| POST | `/upload/presigned` | Both | Nest MinIO (`uritech-uploads`); Edge Supabase |
| POST | `/upload/claim` | Nest-only | Multipart → `uritech-claims` |
| POST | `/notifications/register` | Both | |
| POST | `/telemetry/client-error` | Edge-only | Logs edge |

## Regra de cutover

1. Staging mobile: `EXPO_PUBLIC_API_URL=http://<host>:4001/api/v1` → **só Nest**.
2. Produção: manter Edge até DNS/VPS (`LAUNCH-02`); não duplicar lógica nova só na Edge.
3. Qualquer path novo P0: implementar **primeiro no Nest**, depois espelhar na Edge se prod ainda apontar para Edge.
4. Desligar duplicados Edge quando o tráfego mobile de produção estiver no Nest.

Ver também: [API-EDGE.md](./API-EDGE.md), [STAGING.md](./STAGING.md).
