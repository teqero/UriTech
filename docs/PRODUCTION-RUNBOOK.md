# UriTech — Production Runbook

> Última atualização: 2026-09-10
> Objetivo: checklist operacional completo para colocar o sistema em produção real.

---

## 1. Credenciais e serviços externos a obter

| Serviço | Para quê | Onde obter | Variáveis de ambiente |
|---|---|---|---|
| **Sentry** | Error tracking backend | sentry.io → projeto Node.js | `SENTRY_DSN` |
| **Twilio** ou gateway SMS local (Unitel/AfricasTalking) | SMS OTP de verificação de telefone | twilio.com / contrato operadora | `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` ou `SMS_WEBHOOK_URL` |
| **SMTP** (SendGrid, SES, Mailgun…) | Email verification + password reset | fornecedor de email transacional | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **EMIS / Multicaixa Express** | Pagamentos reais (GPO) | Contrato com EMIS | `MULTICAIXA_MERCHANT_ID`, `MULTICAIXA_API_KEY`, `MULTICAIXA_API_SECRET`, `MULTICAIXA_WEBHOOK_SECRET` |
| **Domínio + DNS** | URLs públicas | Registrar + Cloudflare | `PUBLIC_API_URL`, `PUBLIC_APP_URL`, `ALLOWED_ORIGINS` |
| **Firebase** | Push notifications | console.firebase.google.com | credenciais Firebase |

---

## 2. Checklist de deploy (ordem recomendada)

### Pré-deploy

- [ ] Definir `NODE_ENV=production`
- [ ] Gerar `JWT_SECRET` forte: `openssl rand -base64 48` (mín. 32 chars)
- [ ] Definir `ALLOWED_ORIGINS` com os domínios exatos (ex: `https://app.uritech.ao,https://admin.uritech.ao`)
- [ ] `REQUIRE_VERIFIED_EMAIL=true`
- [ ] `AUTO_LOGIN_AFTER_REGISTER` **ausente ou false**
- [ ] Passwords da BD e Redis geradas (não usar defaults do compose)

### Deploy

```bash
cp deploy/dotenv.example deploy/.env
# Editar deploy/.env com todos os valores reais
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

- [ ] Migrations correm automaticamente no arranque (MigrationService)
- [ ] Verificar `GET /api/v1/health` responde 200
- [ ] Verificar métricas em `GET /metrics` (Prometheus)
- [ ] Seed apenas em ambiente inicial (desativar depois)

### Pós-deploy (primeiras 24h)

- [ ] Testar fluxo completo: registo → verificação email → login → topup Multicaixa (sandbox) → pedido com escrow → entrega → release
- [ ] Confirmar emails a chegar (SMTP)
- [ ] Confirmar SMS OTP a chegar (provider real)
- [ ] Confirmar erros a aparecer no Sentry (forçar um erro de teste)
- [ ] Verificar reconciliação Multicaixa nos logs (cron diário 03:17)

---

## 3. Infraestrutura — decisões pendentes

| Item | Opção A (simples) | Opção B (escala) | Estado |
|---|---|---|---|
| Secrets | Docker secrets / env file protegido | HashiCorp Vault / AWS SM | ⬜ decidir |
| SSL | Certbot no nginx (compose) | Cloudflare proxy (SSL + DDoS incluídos) | ⬜ decidir |
| DDoS/WAF | Cloudflare (plano free já dá proteção) | AWS Shield | ⬜ decidir — **recomendado: Cloudflare** |
| Logs | Loki + Grafana (já existe `deploy/monitoring/`) | Datadog | ⬜ stack parcial existe |
| CDN | Cloudflare | CloudFront | ⬜ segue decisão DDoS |
| Load balancer | nginx upstream com N réplicas do backend | Kubernetes HPA | ⬜ só quando volume justificar |

**Recomendação pragmática para lançamento:** VPS único + Docker Compose (já existe) + **Cloudflare na frente** (SSL, DDoS, CDN grátis) + backups automáticos (já existe `deploy/backup/`).

---

## 4. Monitorização e alertas

- **Prometheus + Grafana**: `docker compose -f deploy/docker-compose.monitoring.yml up -d`
- **Sentry**: alertas por email/Slack em erros 5xx novos
- **Backups**: `deploy/backup/backup.sh` — verificar agendamento (cron no host)
- **Reconciliação Multicaixa**: logs diários; discrepâncias críticas aparecem como `DISCREPÂNCIA CRÍTICA` nos logs → configurar alerta Grafana/Loki para essa string

---

## 5. Incidentes comuns (runbook rápido)

| Sintoma | Ação |
|---|---|
| Login falha em massa | Verificar Redis (tokens) — `docker logs uritech-redis` |
| Webhook Multicaixa não credita | Ver logs: `DISCREPÂNCIA CRÍTICA` na reconciliação; creditar manualmente via reversal/topup |
| SMS não chegam | Confirmar `SMS_PROVIDER` e credenciais; logs mostram `[SMS SIMULADO]` se não configurado |
| Conta bloqueada (lockout) | 5 tentativas → 30 min. Desbloqueio manual: UPDATE users SET failed_login_attempts=0, locked_until=NULL |
| Erros 500 após deploy | Sentry → stack trace; rollback: `git revert` + redeploy |

---

## 6. Limites de segurança configurados (referência)

| Regra | Valor |
|---|---|
| Password | mín. 12 chars + complexidade + blocklist |
| Login lockout | 5 falhas → 30 min |
| 2FA | TOTP + backup codes |
| SMS OTP | 6 dígitos, 5 min TTL, 3 tentativas, 5 envios/dia |
| Password reset | token single-use, 15 min TTL, revoga sessões |
| Fraud velocity | 10 ops/hora, 3 levantamentos/dia, 500k AOA/dia, 5 destinatários/hora |
| Rate limit API | throttler por endpoint (ver controllers) |

---

*Atualizar este documento sempre que um item de infra for decidido/configurado.*
