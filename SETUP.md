# UriTech — Setup de Desenvolvimento Local (Supabase Docker)

Este guia usa **Supabase local via Docker** (Postgres + Redis + MinIO + Edge Runtime). Não é necessário o Supabase Cloud.

## Arquitetura Local

```
┌─────────────────────────────────────────────┐
│  Docker Compose (docker-compose.dev.yml)    │
│  ├── Postgres :5432  (BD principal)         │
│  ├── Redis    :6379  (cache, filas)         │
│  ├── MinIO    :9000  (storage S3)           │
│  └── Edge     :9001  (Deno Edge Functions)  │
└─────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │ Backend NestJS :4000 (fora do Docker)   │
    │ Web Admin      :3000                    │
    │ Web User       :3001                    │
    │ Mobile User    :8084 (Expo)             │
    └─────────────────────────────────────────┘
```

## 1. Pré-requisitos

- Node.js >= 20.19.0
- npm >= 11
- Docker Desktop (ou Docker Engine + Compose)
- Git

## 2. Iniciar a Infraestrutura

```bash
# Subir Postgres, Redis, MinIO e Edge Runtime
docker compose -f docker-compose.dev.yml up -d

# Verificar status
docker compose -f docker-compose.dev.yml ps

# Logs
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f redis
```

**Aceder aos serviços:**
| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Postgres | `localhost:5432` | `uritech` / `uritech` |
| Redis | `localhost:6379` | — |
| MinIO Console | `http://localhost:9002` | `uritech` / `uritech123` |
| MinIO S3 API | `http://localhost:9000` | `uritech` / `uritech123` |
| Edge Runtime | `http://localhost:9001` | — |

## 3. Configurar Variáveis de Ambiente

```bash
cp apps/backend/.env.example apps/backend/.env
# Edite apps/backend/.env se necessário
```

As migrações SQL em `supabase/migrations/` são executadas automaticamente quando o Postgres inicia (mount em `/docker-entrypoint-initdb.d`).

## 4. Instalar Dependências e Build

```bash
npm install
npm run db:up
npm run build
```

**Nota:** As novas dependências do backend (`@nestjs/config`, `@nestjs/throttler`, `helmet`, `ioredis`) serão instaladas neste passo.

`npm run db:up` sobe Postgres, Redis e MinIO locais. O backend depende destes serviços para abrir corretamente a porta `4000`.

## 5. Iniciar o Backend

```bash
npm run dev:backend
```

O backend agora **exige** uma conexão Postgres — não há mais fallback para memória. Se `DATABASE_URL` estiver incorreto, o serviço crasha com mensagem clara.

Se estiver a arrancar tudo pela raiz com `npm run dev`, o script já faz um build inicial de `@uritech/shared` antes de iniciar os serviços para evitar conflitos de escrita no diretório `packages/shared/dist`.

## 6. Iniciar as Web Apps

```bash
# Em terminais separados:
npm run dev:web-admin   # http://localhost:3000
npm run dev:web-user    # http://localhost:3001
```

## 7. Iniciar o Mobile

```bash
# Construir shared package primeiro
npm run build --workspace=@uritech/shared

# Depois:
cd apps/mobile-user
npm run dev        # Wi-Fi (LAN)
# ou
npm run dev:usb    # USB + adb reverse
```

**Redirecionamento ADB (USB):**
```bash
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8084 tcp:8084
adb reverse tcp:9000 tcp:9000  # MinIO
```

## 8. Migrações SQL

As migrações são aplicadas **automaticamente** pelo Docker na primeira vez que o container Postgres inicia.

Para re-aplicar (⚠️ perde dados):
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

Para aplicar migrações numa BD existente:
```bash
# Conectar ao container Postgres
docker exec -it uritech-postgres psql -U uritech -d uritech
# Ou use qualquer cliente SQL (pgAdmin, DBeaver, etc.)
```

## 9. Migrações do Backend (TypeORM)

O backend usa TypeORM com `synchronize: true` em desenvolvimento. Para produção, desativar e usar migrations formais:

```bash
cd apps/backend
# Gerar migration (quando houver mudanças nas entities)
npx typeorm migration:generate -d ./dist/database/data-source.js ./src/database/migrations/NomeMigration
```

## 10. Testar a Stack Completa

```bash
# Health check API
curl http://localhost:4000/api/v1/services

# Listar seguradoras
curl http://localhost:4000/api/v1/insurers

# Login demo
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@uritech.com","password":"demo123"}'
```

## 11. Comandos Úteis

```bash
# Parar tudo
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpa dados)
docker compose -f docker-compose.dev.yml down -v

# Restart
docker compose -f docker-compose.dev.yml restart

# Ver logs de todos os serviços
docker compose -f docker-compose.dev.yml logs -f

# Aceder ao Postgres
docker exec -it uritech-postgres psql -U uritech -d uritech

# Aceder ao Redis
docker exec -it uritech-redis redis-cli

# Listar buckets MinIO
docker exec -it uritech-minio mc alias set local http://localhost:9000 uritech uritech123
docker exec -it uritech-minio mc ls local/
```

## 12. Produção (Deploy)

Ver [`deploy/DEPLOY.md`](deploy/DEPLOY.md) e [`deploy/docker-compose.prod.yml`](deploy/docker-compose.prod.yml).

**Checklist antes de produção:**
- [ ] `JWT_SECRET` alterado (mínimo 32 chars)
- [ ] `NODE_ENV=production`
- [ ] `synchronize: false` no TypeORM (usar migrations)
- [ ] SSL/TLS configurado no nginx
- [ ] Variáveis Multicaixa preenchidas
- [ ] VAPID keys geradas para web push
- [ ] Firebase credenciais para push nativo
- [ ] Backups de BD configurados
- [ ] Rate limits testados
- [ ] Logs centralizados (Sentry/DataDog)

---

**UriTech © 2026**
