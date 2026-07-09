# Figma ↔ App — Mapeamento UriGo

Fonte: [Playground da Config 2026](https://www.figma.com/design/CVncXN39lBVqOMERnXQhyx/Playground-da-Config-2026?node-id=0-1)

Atualizado: Julho 2026 · **60/60 frames com rota** (cobertura funcional)

## Resumo por secção

| Secção | Frames | Estado |
|--------|--------|--------|
| 01 ENTRADA | 5 | ✅ (1 marcador Auth Entry) |
| 02 AUTENTICAÇÃO | 4 | ✅ |
| 03 APP PRINCIPAL | 5 | ✅ |
| 04 TAXI AVANÇADO | 3 | ✅ |
| 05 SERVIÇOS | 9 | ✅ |
| 06 RASTREAR / NEGÓCIOS / AUTO / REBOQUE | 4 | ✅ |
| 07 URIPAY / NOTIF / CONFIRMAÇÃO | 8 | ✅ |
| 08 ESCROW / IA / LICITAR | 7 | ✅ (passos em `/escrow`) |
| 09 DRIVER / VENDOR / ENTREGADOR | 6 | ✅ |
| 10 WEB ADMIN | 4 | ✅ |
| 11 WEB USER PORTAL | 4 | ✅ |
| 12 ADMIN SEGURADORAS | 1 | ✅ |

## 01 · ENTRADA

| Figma | Rota | Estado |
|-------|------|--------|
| Splash | `/splash` | ✅ |
| Onboarding 1–3 | `/onboarding` | ✅ |
| Auth Entry (faixa) | CTA → signin | 🏷️ marcador |

## 02 · AUTENTICAÇÃO

| Figma | Rota | Estado |
|-------|------|--------|
| Sign In Unificado | `/(auth)/signin` | ✅ |
| LoginScreen | `/(auth)/login` | ✅ |
| OTP | `/(auth)/verify` | ✅ |
| Criar Conta | `/(auth)/register` | ✅ |

## 03 · APP PRINCIPAL

| Figma | Rota | Estado |
|-------|------|--------|
| Home | `/(tabs)` | ✅ |
| Taxi Fixo / Licitar | `/taxi` (tabs) | ✅ |
| Pagamento | `/(tabs)/payment` | ✅ |
| Lojas | `/lojas` | ✅ |

## 04 · TAXI AVANÇADO

| Figma | Rota | Estado |
|-------|------|--------|
| Intercidades | `/intercidades` | ✅ |
| Pool | `/pool` | ✅ |
| Agendar | `/agendar` | ✅ |

## 05 · SERVIÇOS

| Figma | Rota | Estado |
|-------|------|--------|
| Sob Demanda | `/servicos` | ✅ |
| Médico | `/medico` | ✅ |
| Beleza e Pet | `/beleza` | ✅ |
| Marketplace (+ filtros) | `/marketplace` | ✅ |
| Envio | `/envio` | ✅ |
| Genie | `/genie` | ✅ |
| Partilha | `/partilha` | ✅ |
| Video Consulta | `/video-consulta` | ✅ |

## 06 · RASTREAR · NEGÓCIOS · AUTO · REBOQUE

| Figma | Rota | Estado |
|-------|------|--------|
| Rastrear Família | `/familia` | ✅ |
| Negócios Próximos | `/negocios` | ✅ |
| Cuidado Auto | `/automovel` | ✅ |
| Reboque Estrada | `/assistencia` | ✅ |

## 07 · URIPAY · NOTIFICAÇÕES · CONFIRMAÇÃO

| Figma | Rota | Estado |
|-------|------|--------|
| UriPay Wallet | `/wallet` → `/(tabs)/payment` | ✅ |
| Carregar / Transferir / Sacar | `/carregar-wallet`, `/transferir-wallet`, `/sacar-wallet` | ✅ |
| Notificações | `/notificacoes` | ✅ |
| Pedido Confirmado | `/pedido-confirmado` | ✅ |
| Rastreamento | `/rastreamento` | ✅ |
| UriProva | `/uriprova` | ✅ |

## 08 · ESCROW · IA · LICITAR

| Figma | Rota | Estado |
|-------|------|--------|
| Escrow 1 / 2 / 3a / 3b | `/escrow` (multi-passo) | ✅ |
| SecurePay | `/securepay` → `/escrow` | ✅ |
| IA Features | `/ia-urigo` | ✅ |
| Licitar Serviços | `/licitar` | ✅ |

## 09 · DRIVER & VENDOR

| Figma | Rota | Estado |
|-------|------|--------|
| Motorista Home | `(driver-tabs)` | ✅ |
| Pedido Entrada | `/driver/ride-request` | ✅ |
| Navegação Ativa | `/driver/navigation` | ✅ |
| Loja Dashboard / Pedidos | `(vendor-tabs)`, `…/orders` | ✅ |
| Entregador Home | `(delivery-tabs)` | ✅ |

## 10–12 · WEB

| Figma | Rota | Estado |
|-------|------|--------|
| Admin Visão / Finanças / Serviços / IA | `web-admin` `/`, `/financas`, `/servicos`, `/ia` | ✅ |
| Web Home / Taxi / Track / Account | `web-user` `/`, `/taxi`, `/tracking`, `/profile` | ✅ |
| Admin Seguradoras | `web-admin` `/seguradoras` | ✅ |

## Nota

Cobertura = ecrã existente e navegável. **Não** inclui paridade visual pixel-a-pixel com o Figma.
