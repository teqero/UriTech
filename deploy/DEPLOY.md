# Deploy em Produção — UriTech (estilo Gojek)

## Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │           NGINX Gateway            │
                    │  :80 consumer  |  :8080 admin      │
                    └───────┬──────────────┬─────────────┘
                            │              │
              ┌─────────────▼──┐    ┌──────▼──────┐
              │  Web User      │    │ Web Admin   │
              │  (super app)   │    │ (ops)       │
              └─────────────┬──┘    └──────┬──────┘
                            │              │
                            └──────┬───────┘
                                   │
                            ┌──────▼──────┐
                            │  API Core   │
                            │  NestJS     │
                            └─────────────┘

Mobile (separado): Expo EAS → App Store / Play Store
  - mobile-user   (consumidor)
  - mobile-driver (motorista)
  - mobile-vendor (lojista)
```

## Deploy rápido (Docker)

```bash
cp deploy/.env.production.example deploy/.env
# Edite deploy/.env com o seu domínio

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

| URL | Serviço |
|-----|---------|
| http://localhost/ | App consumidor (Web User) |
| http://localhost:8080/ | Admin |
| http://localhost/api/v1/ | API |

## Mobile (EAS — estilo Gojek consumer app)

```bash
cd apps/mobile-user
npm install -g eas-cli
eas login
eas build --platform all --profile production
eas submit --platform all
```

Configure `EXPO_PUBLIC_API_URL` em `eas.json` para apontar à API de produção.

## CI/CD

Push para `main` dispara `.github/workflows/production.yml`:
1. `npm run build`
2. Build Docker images
3. Smoke test automático

## Domínios recomendados (produção)

| Subdomínio | Serviço |
|------------|---------|
| `urigo.ao` | Web User (nginx :80) |
| `admin.urigo.ao` | Web Admin (nginx :8080 ou vhost) |
| `api.urigo.ao` | Backend API |
