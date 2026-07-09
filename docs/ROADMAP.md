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

## Fase 4 — Go-to-market

- Publicação Play Store / App Store (EAS)
- White-label por cliente (marca admin → builds)
- SLA bug support + documentação licença
- Domínios produção (Vercel + API)

## Métricas de sucesso

- [ ] 100% fluxos base com backend persistente
- [ ] Pagamento real end-to-end
- [ ] 52+ serviços on-demand no admin
- [ ] 0 rotas órfãs no mobile
- [ ] AI surge/fraud em produção (mín. 2 features)
