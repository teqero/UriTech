# UriTech Backend — Testes E2E

## Setup

Os testes e2e usam **NestJS TestingModule** + **supertest** com mocks em memória (sem Docker necessário para a suite básica).

## Correr testes

```bash
cd apps/backend
npm run test:e2e
```

## Estrutura

```
test/
├── auth.e2e-spec.ts          # 6 testes — login, refresh, logout, blacklist
├── jest-e2e.config.js        # Config Jest para e2e
├── setup.ts                  # Setup global (timeout)
└── utils/
    ├── test-app.ts           # Factory de NestJS app para testes
    └── mock-redis.service.ts # Redis in-memory para testes
```

## Cobertura atual (6 testes)

| Cenário | Endpoint | Resultado |
|---------|----------|-----------|
| Login válido | `POST /auth/login` | 201 + access + refresh tokens |
| Login email inexistente | `POST /auth/login` | 401 |
| Login password errada | `POST /auth/login` | 401 |
| Refresh token rotação | `POST /auth/refresh` | 201 + novo par de tokens |
| Refresh token inválido | `POST /auth/refresh` | 401 |
| Logout + blacklist | `POST /auth/logout` | 201 + token na blacklist |

## Expandir testes e2e

Para adicionar testes de rides, storage, etc. com dados reais:

1. Subir Postgres + Redis:
   ```bash
   docker compose -f docker-compose.dev.yml up -d postgres redis
   ```

2. Atualizar `test/utils/test-app.ts` para usar `AppModule` completo em vez de `AuthModule` isolado.

3. Adicionar novos ficheiros `*.e2e-spec.ts` na pasta `test/`.

## Dependências de teste

- `supertest` — HTTP assertions
- `jest` + `ts-jest` — runner + transform
- `bcryptjs` — hash de passwords nos testes
