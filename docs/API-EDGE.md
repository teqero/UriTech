# API Edge (`uritech-api`)

Base URL de produção:

`https://akyzbuvdokdrjpuzhocg.supabase.co/functions/v1/uritech-api/api/v1`

O cliente mobile usa apenas o sufixo do path (ex.: `/health`), porque `EXPO_PUBLIC_API_URL` já inclui `/api/v1`.

## Observabilidade

| Header | Direcção | Descrição |
|--------|----------|-----------|
| `X-Request-Id` | cliente → API → cliente | Correlaciona pedidos nos logs Supabase |
| `X-UriGo-Client` | cliente | Nome e versão da app |
| `X-UriGo-Channel` | cliente | `production`, `preview`, etc. |

## Ownership

Tabela canónica path → serviço: **[API-ROUTE-OWNERSHIP.md](./API-ROUTE-OWNERSHIP.md)**. Nest é fonte de verdade; esta edge é BFF de produção até cutover.

## Rotas P0

| Método | Path | Notas |
|--------|------|-------|
| GET | `/health` | Inclui ping à base de dados |
| POST | `/auth/login` | Password bcrypt (coluna `users.password`). Bypass `demo123` **só** com secret `ALLOW_DEMO_AUTH=true`. Password vazia → 400 |
| POST | `/auth/refresh` | Renova token `demo-{userId}` (prefixo legado; não implica modo demo) |
| GET/POST | `/wallet/*` | Requer `Authorization: Bearer demo-{id}` |
| GET/POST/PATCH | `/social-payments/*` | UriPay (import, sync, pay, PATCH preço) |
| GET | `/social-payments/image` | Proxy de imagens OG |
| GET/POST | `/orders/*` | Checkout demo |
| GET/PATCH | `/rides/*` | Estado da corrida |
| GET/POST | `/insurers`, `/claim-evidence` | UriProva |
| POST | `/upload/presigned` | Bucket `uritech-uploads` |
| POST | `/notifications/register` | Push token demo |
| POST | `/telemetry/client-error` | Erros da app (logs edge) |

### Auth env

| Secret | Default | Efeito |
|--------|---------|--------|
| `ALLOW_DEMO_AUTH` | off | Se `true`, aceita `demo123` mesmo sem hash correspondente |

`GET /health` inclui `auth: { demoAuth, passwordAuth }`.

## Respostas de erro

```json
{ "message": "...", "requestId": "uuid" }
```

Reporta o `requestId` ao suporte para localizar o incidente nos logs.