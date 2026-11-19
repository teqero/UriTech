# UriGo — Pilares para produto de classe mundial

Este documento resume o que torna um super-app **fiável, seguro e escalável** (referências: Gojek, Grab, Rappi) e como o UriTech se alinha.

## 1. Confiança (Trust)

- Pagamentos com ledger imutável, escrow e reconciliação (NestJS + Postgres).
- UriProva com hash de integridade e referência única de sinistro.
- RLS na Supabase para impedir acesso directo às tabelas sensíveis via chave anon.

## 2. Disponibilidade (Reliability)

- Health check público: `GET /api/v1/health` (com latência da base de dados).
- Cliente com retry leve em 502–504 e refresh token (`/auth/refresh`).
- Banner de ligação na app quando a API está offline (incl. deteção `offline` na web).
- `X-Request-Id` em todos os pedidos para suporte e logs.
- Boundaries globais: `ErrorBoundary` no `_layout`, `+not-found.tsx`, `RootErrorBoundary` (não usar `+error.tsx` — crasha Expo Router v6).

## 3. Velocidade percebida (Performance)

- Edge function regional (Supabase) para leituras e acções do dia-a-dia.
- Imagens de anúncios via proxy (`/social-payments/image`).
- Build web optimizado com script monorepo (`scripts/build-mobile-web.mjs`).

## 4. Segurança (Security)

- Demo/prod separados: password `demo123` na edge; JWT forte no NestJS em VPS.
- Sem secrets no repositório; usar Supabase/Vercel env.
- CAPTCHA configurável no backend (`CAPTCHA_PROVIDER`).

## 5. Experiência (UX)

- 60+ rotas Figma navegáveis; fluxos críticos com feedback de erro humano.
- UriPay: importação + correcção manual de preço quando o anúncio bloqueia scraping.
- Home com atalhos para SecurePay, UriProva e Pagar por Link.

## 6. Escala (Scale path)

| Hoje | Próximo passo |
|------|----------------|
| Supabase Edge API | NestJS em `api.*` para 100% paridade |
| Login demo | EMIS + SMS + email verificado |
| Vercel static web | EAS builds + stores |
| Monorepo Expo | CI verde + `npm ci --legacy-peer-deps` |

## Métricas alvo (produto comercial)

- p95 API &lt; 800 ms (funções edge).
- 99.5% uptime mensal na API pública.
- 0 rotas 404 nos fluxos P0 do mobile (wallet, taxi, orders, uriPay, uriprova).
- NPS &gt; 40 na cohort Luanda (pós-lançamento).