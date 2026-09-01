# UriTech - Super App

UriTech é um super app completo inspirado no Gojek, com design baseado no sistema Asphalt. Inclui 5 aplicações integradas para usuários, motoristas, vendedores e administradores.

## Arquitetura

```
UriTech/
├── apps/
│   ├── backend/          # API REST (NestJS) - porta 4000
│   ├── web-admin/        # Painel administrativo (Next.js) - porta 3000
│   ├── web-user/         # App web do usuário (Next.js) - porta 3001
│   ├── mobile-user/      # App mobile do usuário (Expo)
│   ├── mobile-driver/    # App mobile do motorista (Expo)
│   └── mobile-vendor/    # App mobile do vendedor (Expo)
└── packages/
    └── shared/           # Design tokens, tipos e constantes compartilhados
```

## Serviços Disponíveis


| Serviço    | Descrição                   |
| ---------- | --------------------------- |
| **Ride**   | Transporte (moto e carro)   |
| **Food**   | Delivery de comida          |
| **Mart**   | Compras do dia a dia        |
| **Send**   | Envio de pacotes            |
| **Pay**    | Pagamentos e transferências |
| **Pulsa**  | Recarga de celular          |
| **Bills**  | Pagamento de contas         |
| **Health** | Consultas e medicamentos    |


## Design System

Baseado no Gojek Asphalt Design System:

- **Cor primária:** `#00AA13` (verde Gojek)
- **Cor secundária:** `#F06400` (laranja)
- **Tipografia:** Inter
- **Cores por serviço:** Ride (verde), Food (vermelho), Mart (roxo), Send (azul)

## Pré-requisitos

- Node.js >= 20
- npm >= 11
- Para mobile: Expo Go app no dispositivo ou emulador Android/iOS

## Instalação

```bash
cd UriTech
npm install
npm run db:up
```

`npm run db:up` sobe as dependências locais obrigatórias do backend: Postgres, Redis e MinIO.

## Executar

### Todos os serviços

```bash
npm run dev
```

O script faz um build inicial de `@uritech/shared` antes de arrancar os restantes serviços, para evitar conflitos de escrita em `packages/shared/dist`.

Pré-requisito: deixe `npm run db:up` ativo antes do primeiro arranque, caso contrário o backend não abre a porta `4000`.

### Individualmente

```bash
# Dependências locais do backend (primeira vez)
npm run db:up

# Backend API
npm run dev:backend        # http://localhost:4000/api/v1

# Web Admin
npm run dev:web-admin      # http://localhost:3000

# Web User
npm run dev:web-user
# Mobile Vendor
npm run dev:mobile-vendor  # Expo - porta 8083
```

### Mobile User (telemóvel físico)

```bash
# 1. Dependências locais (obrigatório para backend e UriProva)
npm run db:up

# 2. Backend (obrigatório para UriProva e seguradoras)
npm run dev:backend

# 3. App no telemóvel
cd apps/mobile-user
npm run dev:usb          # USB + adb reverse
# ou
npm run dev              # Wi‑Fi (LAN)

# 4. Redireccionar API, Metro e storage local (USB)
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8084 tcp:8084
adb reverse tcp:9000 tcp:9000
```

Opcional: crie `apps/mobile-user/.env` com `EXPO_PUBLIC_API_URL=http://SEU_IP:4000/api/v1`.

### UriProva (evidências para seguradoras)

- **Mobile:** Serviços → UriProva → captura com câmara/GPS → envio à API
- **Admin:** http://localhost:3000/seguradoras — gestão de seguradoras e sinistros recebidos
- **API:** `POST /api/v1/claim-evidence`, `GET /api/v1/claim-evidence`

## App unificada por perfil

Todos os utilizadores instalam **a mesma app** (`mobile-user` / `web-user`). Após login, a interface adapta-se ao perfil:

| Perfil | Mobile | Web | Conta demo |
|--------|--------|-----|------------|
| Cliente | `(tabs)` | `/` | joao@uritech.com |
| Motorista | `(driver-tabs)` | `/driver` | budi@uritech.com |
| Entregador | `(delivery-tabs)` | `/delivery` | entregador@uritech.com |
| Vendor | `(vendor-tabs)` | `/vendor` | warung@uritech.com |
| Admin | `(admin-portal)` | `/admin` | admin@uritech.com |

Palavra-passe demo: `demo123`

Configuração central: `packages/shared/src/profiles.ts`

Apps `mobile-driver` e `mobile-vendor` mantêm-se no monorepo (legado); o conteúdo foi integrado em `mobile-user`.

## Prontidão para produção

| Área | Estado | Notas |
|------|--------|-------|
| UI mobile-user / driver / vendor | Funcional (protótipo) | Fluxos alinhados aos PDFs; dados em grande parte mock |
| Web admin / web user | Funcional | Liga ao backend local |
| Backend API | **Pré-produção** | Dados em memória; reinício apaga sinistros |
| UriProva | **Pré-produção** | Envio real à API + webhook HTTP; media em base64 (ficheiros &lt; 8 MB) |
| Auth JWT | Parcial | Endpoints existem; apps mobile sem login real |
| Pagamentos (Multicaixa) | Mock | Integração real pendente |
| Base de dados | **Em falta** | Migrar para Postgres/Supabase antes de produção |
| Push / mapas / tracking | Mock | Firebase e mapas reais pendentes |

**Bloqueadores antes de produção:** persistência em BD, auth end-to-end, storage cloud para media (Azure/S3), HTTPS e variáveis de ambiente em deploy (`deploy/docker-compose.prod.yml`).

## API Endpoints


| Método | Endpoint                | Descrição         |
| ------ | ----------------------- | ----------------- |
| POST   | `/api/v1/auth/login`    | Login             |
| POST   | `/api/v1/auth/register` | Registro          |
| GET    | `/api/v1/services`      | Listar serviços   |
| GET    | `/api/v1/orders`        | Listar pedidos    |
| GET    | `/api/v1/rides`         | Listar corridas   |
| GET    | `/api/v1/vendors`       | Listar vendedores |
| GET    | `/api/v1/drivers`       | Listar motoristas |
| GET    | `/api/v1/insurers`      | Listar seguradoras |
| POST   | `/api/v1/claim-evidence`| Submeter evidências UriProva |
| GET    | `/api/v1/claim-evidence`| Listar sinistros |


## Telas Implementadas

### Web Admin

- Dashboard com métricas
- Gestão de usuários, motoristas e vendedores
- Listagem de pedidos
- Analytics e configurações

### Web User

- Home com grid de serviços
- Banners promocionais
- Pedido de corrida (Ride)
- Pedido de comida (Food)
- Navegação inferior

### Mobile User

- Home, Pedidos, Promos, Perfil
- Tela de corrida com seleção de veículo
- Design mobile-first estilo Gojek

### Mobile Driver

- Toggle online/offline
- Aceitar/recusar corridas
- Ganhos e histórico
- Perfil do motorista

### Mobile Vendor

- Gestão de pedidos (aceitar, preparar, pronto)
- Cardápio com disponibilidade
- Analytics da loja
- Perfil da loja

## Figma Design

Design de referência: [Playground da Config 2026](https://www.figma.com/design/CVncXN39lBVqOMERnXQhyx/Playground-da-Config-2026?node-id=0-1)

Mapeamento Figma ↔ app: [`docs/design/FIGMA-MAP.md`](docs/design/FIGMA-MAP.md)

## Tecnologias

- **Monorepo:** Turborepo + npm workspaces
- **Backend:** NestJS, JWT Auth
- **Web:** Next.js 15, React 19
- **Mobile:** Expo 52, React Native, Expo Router
- **Shared:** TypeScript, design tokens Asphalt

## Licença

Projeto privado - UriTech © 2026