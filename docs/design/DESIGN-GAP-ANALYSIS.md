# Auditoria PDF vs Implementação — Julho 2026

Design source: `docs/design/urigo-screens-part1.pdf`, `part2.pdf`, `part3.pdf`

## Resumo executivo

| App | Cobertura estimada | Estado |
|-----|-------------------|--------|
| mobile-user | ~78% → **~82%** (com UriProva) | Rotas UI; falta auth/maps reais |
| mobile-driver | ~88% | Fluxo motorista sólido |
| mobile-vendor | ~83% | Tabs pedidos parcialmente interactivas |
| web-user | ~35% → **~38%** | Landing + serviços core; falta Part 2 |
| web-admin | ~70% → **~75%** | + Seguradoras UriProva |

**Cobertura global UI:** ~58% → **~60%** (protótipo funcional, não produção)

---

## Parte 1 — Mobile User (PDF págs. 5–7)

| PDF | Tela | Rota | Status |
|-----|------|------|--------|
| Pág. 5 | Login | `/(auth)/login` | ✅ UI |
| Pág. 5 | OTP 6 dígitos | `/(auth)/verify` | ✅ UI |
| Pág. 5 | Criar conta | `/(auth)/register` | ✅ UI |
| Pág. 6 | Home + grid serviços | `/(tabs)` | ✅ Inclui UriProva |
| Pág. 6 | Taxi Fixo/Licitar | `/taxi` | ✅ UI |
| Pág. 6 | Pagamento | `/(tabs)/payment` | ✅ UI |
| Pág. 7 | Intercidades | `/intercidades` | ✅ UI |
| Pág. 7 | UriGo Pool | `/pool` | ✅ UI |
| Pág. 7 | Agendar | `/agendar` | ✅ UI |

### Lacunas Parte 1
- Auth real (JWT, refresh) — ❌
- Mapa em tempo real no taxi — ❌ mock
- Push notifications — ❌

---

## Parte 2 — Mobile User + Driver/Vendor (PDF págs. 10–11)

| PDF | Tela | Rota | Status |
|-----|------|------|--------|
| Pág. 10 | Escrow/SecurePay | `/escrow`, `/securepay` | ✅ |
| Pág. 10 | IA UriGo | `/ia-urigo` | ✅ UI |
| Pág. 10 | Licitar serviços | `/licitar` | ✅ UI |
| **Novo** | UriProva sinistros | `/uriprova` | ✅ **Novo** |
| Pág. 11 | Driver online | mobile-driver | ✅ |
| Pág. 11 | Aceitar pedido | mobile-driver | ✅ |
| Pág. 11 | Vendor dashboard | mobile-vendor | ✅ |
| Pág. 11 | Vendor pedidos | mobile-vendor | ⚠️ tabs não interactivas |

### Lacunas Parte 2
- Video consulta médica — ❌
- UriPay transferir/levantar — ❌
- `/notificacoes` — ✅ rota existe, ❌ não ligada na nav
- Marketplace imóveis/carros fluxo completo — ⚠️ parcial
- Genie compras — ⚠️ UI básica

---

## Parte 3 — Web User (PDF págs. 2–5)

| PDF | Tela | Rota | Status |
|-----|------|------|--------|
| Landing | Home | `/` | ✅ |
| Taxi | Solicitar | `/taxi` | ✅ |
| Tracking | Mapa | `/tracking` | ⚠️ mock |
| Perfil | Conta | `/profile` | ✅ básico |

### Serviços web dinâmicos `[service]`

| Serviço | Rota | Status |
|---------|------|--------|
| envio | `/envio` | ✅ |
| lojas | `/lojas` | ✅ |
| servicos | `/servicos` | ✅ |
| medico | `/medico` | ✅ |
| beleza | `/beleza` | ✅ |
| securepay | `/securepay` | ✅ |
| uriprova | `/uriprova` | ✅ **Novo** |

### Lacunas Web (prioridade)
- Pool, intercidades, agendar — ❌ sem rotas web
- Marketplace, genie, licitar — ❌
- Paridade mobile Part 2 — ❌ ~65% em falta

---

## Backoffice Admin

| Módulo | Rota | Status |
|--------|------|--------|
| Dashboard | `/` | ✅ |
| Pedidos | `/orders` | ✅ |
| Motoristas | `/drivers` | ✅ CRUD |
| Comerciantes | `/vendors` | ✅ CRUD |
| **Seguradoras** | `/seguradoras` | ✅ **Novo** |
| Utilizadores | `/users` | ✅ |
| Finanças | `/financas` | ✅ |
| Serviços | `/servicos` | ✅ |
| IA | `/ia` | ✅ |
| Integrações | `/settings/integracoes` | ✅ |
| Marca | `/settings` | ✅ |

---

## Fluxos de continuação (Gojek/InDrive)

| Serviço | Web continuar | Mobile após acção |
|---------|---------------|-------------------|
| Taxi | `/tracking?service=taxi` | `/rastreamento` |
| Envio | `/tracking?service=envio` | `/rastreamento` |
| Lojas | `/food` | loja → tracking |
| SecurePay | `/securepay` | `/securepay` |
| **UriProva** | `/uriprova` | `/uriprova` |

---

## Próximos passos recomendados

1. **UriProva** — captura real com câmara (`expo-image-picker`) + upload cloud
2. **Web parity** — rotas Part 2 no web-user
3. **Notificações** — ligar `/notificacoes` na Home e Perfil
4. **Auth + pagamentos** — produção
5. **Firewall Expo** — documentar regra Windows para LAN testing

Ver também: [URIPROVA.md](../URIPROVA.md), [ROADMAP.md](../ROADMAP.md)
