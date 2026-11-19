# UriGo — Plano executável (pré-lançamento)

Actualizado: 2026-11-19  
Objectivo: fechar produto demo→comercial **sem** activar ainda os itens de lançamento oficial.

Issues: https://github.com/teqero/UriTech/issues

## Bloqueado até lançamento oficial

Não executar agora (explicitamente diferidos) — epic [#1](https://github.com/teqero/UriTech/issues/1):

| ID | Item | Notas |
|----|------|--------|
| LAUNCH-01 | Pagamento real EMIS/Multicaixa + webhooks + reconciliação | Manter Multicaixa **demo** na edge/Nest |
| LAUNCH-02 | DNS `app.urigo.ao` → Vercel | Alias Vercel já existe; DNS fica para go-live |
| LAUNCH-03 | EAS → Play Store (internal testing) | Web Vercel continua a ser o canal público |

Checklist de lançamento (quando for a hora):

- [ ] LAUNCH-01 — EMIS produção + webhooks + ledger/reconciliação
- [ ] LAUNCH-02 — DNS A/CNAME `app.urigo.ao` → Vercel
- [ ] LAUNCH-03 — EAS build Android + Play Console internal track

---

## Agora — sprints executáveis

### Sprint A — Confiança & auth (1–2 semanas)

| ID | Issue | Entregável | Done when |
|----|-------|------------|-----------|
| A1 | [#2](https://github.com/teqero/UriTech/issues/2) Auth produção (sair de `demo123`) | Login bcrypt + flag demo | **Feito** (issue fechada) |
| A2 | [#3](https://github.com/teqero/UriTech/issues/3) SMS OTP + email | Reutilizar Nest | Verificação real ou flag |
| A3 | [#4](https://github.com/teqero/UriTech/issues/4) Sentry mobile | `EXPO_PUBLIC_SENTRY_DSN` + boundaries | Crash com DSN no Sentry |
| A4 | [#5](https://github.com/teqero/UriTech/issues/5) Smoke CI API | Job `edge-api-smoke` | CI falha em 5xx |

### Sprint B — Uma API canónica (1–2 semanas)

| ID | Issue | Entregável | Done when |
|----|-------|------------|-----------|
| B1 | [#6](https://github.com/teqero/UriTech/issues/6) NestJS staging VPS | Compose local `:4001` + doc | **Feito local** — VPS público opcional |
| B2 | [#7](https://github.com/teqero/UriTech/issues/7) Paridade edge→Nest | Contratos shared | Mobile staging sem 404 P0 |
| B3 | [#8](https://github.com/teqero/UriTech/issues/8) Ownership de rotas | Doc path→serviço | Uma fonte de verdade |

### Sprint C — Fluxos P0 persistentes (1–2 semanas)

| ID | Issue | Entregável | Done when |
|----|-------|------------|-----------|
| C1 | [#9](https://github.com/teqero/UriTech/issues/9) Taxi→tracking→pay | Estados na DB | E2E manual documentado |
| C2 | [#10](https://github.com/teqero/UriTech/issues/10) UriPay→escrow | Fluxo mobile+API | Ledger/escrow registado |
| C3 | [#11](https://github.com/teqero/UriTech/issues/11) UriProva upload→claim | Bucket uploads | Ref + hash visíveis |

### Sprint D — Qualidade & escala suave (contínuo)

| ID | Issue | Entregável | Done when |
|----|-------|------------|-----------|
| D1 | [#12](https://github.com/teqero/UriTech/issues/12) Docs ErrorBoundary | Pilares alinhados | Doc correcta |
| D2 | [#13](https://github.com/teqero/UriTech/issues/13) Políticas RLS | Policies por user | Anon não lê wallets |
| D3 | [#14](https://github.com/teqero/UriTech/issues/14) i18n PT/EN P0 | Toggle idioma | Fluxos P0 bilíngues |
| D4 | [#15](https://github.com/teqero/UriTech/issues/15) Catálogo ≥10 | CRUD + home API | ≥10 serviços |
| D5 | [#16](https://github.com/teqero/UriTech/issues/16) UriPay UX | Sync + preço manual | 0 dead-ends |

---

## Ordem recomendada

```
A1 → A3 → A4 → B1 → B2 → C1/C2/C3 → A2 → D*
LAUNCH-* só no go-live
```

## Definition of Done (global pré-lançamento)

- [ ] Zero rotas 404 nos fluxos P0 (taxi, wallet, UriPay, UriProva, orders)
- [ ] Auth sem password fixa em produção
- [ ] NestJS staging a servir o mobile
- [ ] Sentry a receber erros mobile
- [ ] CI smoke verde
- [ ] LAUNCH-01/02/03 documentados e **não** iniciados

Ver também: [ROADMAP.md](./ROADMAP.md) · [WORLD-CLASS-PILLARS.md](./WORLD-CLASS-PILLARS.md) · [API-EDGE.md](./API-EDGE.md)
