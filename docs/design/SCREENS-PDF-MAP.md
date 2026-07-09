# UriGo - Mapeamento PDF → Implementação

Design source: `docs/design/urigo-screens-part1.pdf`, `part2.pdf`, `part3.pdf`

## Parte 1 Mobile — Páginas 5, 6, 7

| PDF | Telas | Rotas |
|-----|-------|-------|
| Pág. 5 | Login, OTP (6 dígitos), Criar Conta | `/(auth)/login`, `/(auth)/verify`, `/(auth)/register` |
| Pág. 6 | Home, Taxi (Fixo/Licitar), Pagamento | `/(tabs)`, `/taxi`, `/(tabs)/payment` |
| Pág. 7 | Intercidades, UriGo Pool, Agendar | `/intercidades`, `/pool`, `/agendar` |

## Parte 2 Mobile — Páginas 10, 11

| PDF | Telas | Rotas |
|-----|-------|-------|
| Pág. 10 | Escrow Seguro, IA UriGo, Licitar Serviços | `/escrow`, `/ia-urigo`, `/licitar` |
| Pág. 11 | Driver Online, Aceitar Pedido, Navegação, Vendor Dashboard + Pedidos | `mobile-driver`, `mobile-vendor` ✓ fluxos completos |

## Parte 3 Web — Página 1 (4 telas)

| PDF | Telas | Rotas |
|-----|-------|-------|
| Pág. 2–5 | Landing → Taxi → **Tracking (mapa)** → Perfil | `/`, `/taxi`, `/tracking`, `/profile` |

## Fluxos corrigidos (Gojek / InDrive)

| Serviço | Web — botão continuar | Mobile — após solicitar |
|---------|----------------------|-------------------------|
| Taxi | `/tracking?service=taxi&dest=...` | `/rastreamento` com mapa |
| Envio | `/tracking?service=envio` | `/rastreamento` |
| Lojas | `/food` → tracking | Loja → `/rastreamento` |
| Serviços/Médico/Beleza | `/tracking?service=...` | respetiva rota → tracking |
| SecurePay | `/securepay` | `/securepay` |
| **UriProva** | `/uriprova` | `/uriprova` |

Ver auditoria completa: [DESIGN-GAP-ANALYSIS.md](./DESIGN-GAP-ANALYSIS.md) · [URIPROVA.md](../URIPROVA.md)
