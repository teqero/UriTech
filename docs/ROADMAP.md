# UriGo — Roadmap Gojek Clone

Objectivo: passar de **~50%** (protótipo UI) para **80%+** (produto comercial).

## Fase 1 — Fundação (4–6 semanas)

| Prioridade | Item | Entregável |
|------------|------|------------|
| P0 | Backend Postgres (Supabase) | CRUD real: users, rides, orders, brand, integrações |
| P0 | Pagamentos Angola | Multicaixa + wallet UriPay + webhooks |
| P0 | Fluxos completos | Taxi → tracking; serviços → tracking (sem ir ao perfil) |
| P1 | Rotas órfãs | Ligar familia, negocios, automovel na home |
| P1 | Push notifications | Firebase FCM |
| P1 | Paragens múltiplas | Taxi multi-stop (Gojek) |

## Fase 2 — Escala de serviços (4–6 semanas)

| Prioridade | Item | Entregável |
|------------|------|------------|
| P0 | On-demand 52+ | Catálogo admin + API + mobile |
| P0 | Lojas 10 categorias | Admin configurável (Gojek Store Deliveries) |
| P1 | Marketplace real | Imóveis, carros, itens com listings DB |
| P1 | Genie / Runner | Dispatch real ou fila demo persistente |
| P1 | Web parity | Web-user com rotas equivalentes ao mobile |

## Fase 3 — Diferenciação (6–8 semanas)

| Prioridade | Item | Entregável |
|------------|------|------------|
| P0 | **UriProva** | Evidências sinistro: captura real, upload cloud, portal seguradora |
| P1 | i18n | PT + EN + 3 idiomas; 6+ moedas admin |
| P1 | Geo-fencing | Admin define zonas + marketing |
| P2 | AI Taxi | Surge pricing, fraude, promo auto, WhatsApp booking |
| P2 | Video consulta | WebRTC médico/astrologia |
| P2 | Track family | Consent + mapa tempo real |

## Fase 4 — Go-to-market (**só no lançamento oficial**)

> Diferidos até go-live (não trabalhar agora):

- [ ] **LAUNCH-01** Pagamento real EMIS/Multicaixa + webhooks + reconciliação
- [ ] **LAUNCH-02** DNS `app.urigo.ao` → Vercel
- [ ] **LAUNCH-03** EAS → Play Store (internal testing) / App Store
- White-label por cliente (marca admin → builds)
- SLA bug support + documentação licença

## Pré-lançamento (activo)

Plano executável com sprints A–D e IDs: **[EXECUTION-PLAN.md](./EXECUTION-PLAN.md)**

## Métricas de sucesso

- [x] API edge com wallet, orders, rides, UriProva, UriPay (2026-11)
- [x] Health check + refresh token na edge
- [x] RLS em tabelas financeiras (migração)
- [x] Build web Expo estável (`EXPO_EXPORT_WEB` + CI `build:mobile-web`)
- [x] Telemetria leve + `X-Request-Id` + erros cliente na edge
- [x] Bucket `uritech-uploads` para presigned upload
- [ ] 100% fluxos base com backend persistente (NestJS VPS) — Sprint B
- [ ] Pagamento real end-to-end (EMIS) — **LAUNCH-01** (adiado)
- [ ] 52+ serviços on-demand no admin — Sprint D (base primeiro)
- [x] 0 rotas órfãs no mobile (FIGMA-MAP 60/60)
- [ ] AI surge/fraud em produção (mín. 2 features)

Ver também: [WORLD-CLASS-PILLARS.md](./WORLD-CLASS-PILLARS.md) · [EXECUTION-PLAN.md](./EXECUTION-PLAN.md)
