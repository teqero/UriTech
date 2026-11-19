# UriGo — Staging NestJS (Sprint B1)

## Objectivo

API NestJS com o mesmo prefixo `/api/v1` que a edge, para o mobile poder apontar `EXPO_PUBLIC_API_URL` para staging.

## URL local (default) — **activa agora**

| Serviço | URL |
|---------|-----|
| Health | http://localhost:4001/api/v1/health |
| API base | http://localhost:4001/api/v1 |
| Swagger | http://localhost:4001/api/docs |

Smoke verificado (2026-11-19): `status: healthy` (postgres/redis/storage up). Login seed: password `demo123`.

> **Público `api-staging.urigo.ao`:** publicar este stack num VPS (Docker Compose) e apontar DNS. DNS de produção (`app.urigo.ao`) continua diferido para lançamento oficial — staging pode usar um hostname temporário ou IP.

## Subir staging

```bash
cp deploy/.env.staging.example deploy/.env.staging
# editar JWT_SECRET

docker compose -f deploy/docker-compose.staging.yml --env-file deploy/.env.staging up -d --build
```

Smoke:

```bash
curl -fsS http://localhost:4001/api/v1/health
# expect HTTP 200 e checks postgres/redis/storage
```

Parar:

```bash
docker compose -f deploy/docker-compose.staging.yml --env-file deploy/.env.staging down
```

## Mobile apontar para staging

```bash
# apps/mobile-user — env local / EAS preview
EXPO_PUBLIC_API_URL=http://localhost:4001/api/v1
# ou http://<IP-LAN>:4001/api/v1 no telemóvel
```

## Relação com a Edge

| Ambiente | API |
|----------|-----|
| Produção web actual | Supabase Edge `uritech-api` |
| Staging Nest | Este compose (`:4001`) |
| Produção Nest (futuro) | `api.urigo.ao` via `deploy/docker-compose.prod.yml` |

Ver ownership de rotas: issue [#8](https://github.com/teqero/UriTech/issues/8) / `docs/API-EDGE.md`.

## Checklist VPS (quando houver máquina)

- [ ] Clone do repo + Docker no VPS
- [ ] `deploy/.env.staging` com secrets fortes
- [ ] Portas 80/443 + reverse proxy (Caddy/Nginx) → `:4001`
- [ ] Hostname `api-staging.urigo.ao` (ou similar)
- [ ] Actualizar esta doc com a URL pública final
