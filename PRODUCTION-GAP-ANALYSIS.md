# UriTech — Checklist de Produção (Gap Analysis)

> Data: 2026-08-19
> Versão do projeto: 1.0.0
> Estado: **Funcional em dev/staging. NÃO PRONTO para produção real sem os itens abaixo.**

---

## Resumo Executivo

O projeto UriTech tem uma base sólida: arquitetura monorepo bem estruturada, backend NestJS com TypeORM, health checks, rate limiting, Swagger, graceful shutdown, migrations automáticas, backups, e métricas Prometheus. No entanto, **existem gaps significativos** que impedem o deploy em produção real, especialmente nas áreas de segurança, pagamentos, infraestrutura, compliance e funcionalidades críticas de negócio.

---

## 🔴 P0 — CRÍTICO (Bloqueia produção)

### Segurança

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 1 | **Secrets management** | ❌ FALTA | JWT_SECRET, DB passwords, API keys em `.env` plano. Não há HashiCorp Vault, AWS Secrets Manager, ou equivalente. |
| 2 | **Criptografia em trânsito** | ⚠️ PARCIAL | Nginx tem SSL config mas não vejo certificados LetsEncrypt/auto-renewal configurados no Docker. |
| 3 | **Criptografia em repouso** | ❌ FALTA | Não há encriptação de dados sensíveis na BD (NIFs, documentos de motoristas, dados bancários). |
| 4 | **Rate limiting por IP** | ⚠️ PARCIAL | Throttler existe mas é baseado em Redis. Não há rate limit no nginx por IP para DDoS. |
| 5 | **WAF / Firewall** | ❌ FALTA | Sem proteção contra SQL injection automatizada, XSS, CSRF no nível de aplicação (só helmet). |
| 6 | **Audit logs persistentes** | ⚠️ PARCIAL | AuditLogService existe mas guarda em Postgres. Sem retenção definida, sem imutabilidade, sem stream para SIEM. |
| 7 | **Brute force protection** | ❌ FALTA | Auth não tem lockout após N tentativas falhadas, não tem CAPTCHA, não tem 2FA/MFA. |
| 8 | **Input sanitization** | ⚠️ PARCIAL | Class-validator valida DTOs mas não há sanitização explícita contra XSS nos campos de texto livre. |
| 9 | **CORS em produção** | ⚠️ PARCIAL | CORS permite `*` em dev. Em prod precisa de whitelist estrita e validação de origins. |
| 10 | **Security headers** | ⚠️ PARCIAL | Helmet presente mas CSP pode ser mais restritiva. Falta HSTS preload, Referrer-Policy, Permissions-Policy. |

### Autenticação & Autorização

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 11 | **2FA/MFA** | ❌ FALTA | Nenhum factor de autenticação adicional (SMS, TOTP, email code). Crítico para wallet/pagamentos. |
| 12 | **Password policy** | ❌ FALTA | Não há validação de força de password (mínimo 12 chars, complexidade, breached password check via HaveIBeenPwned). |
| 13 | **Session management** | ⚠️ PARCIAL | Refresh tokens em Redis são revogáveis, mas não há limitação de sessões simultâneas por utilizador. |
| 14 | **RBAC granular** | ⚠️ PARCIAL | Roles existem (user/driver/vendor/admin) mas não há permissões finas (ex: vendor só pode ver próprios pedidos). |
| 15 | **Device fingerprinting** | ❌ FALTA | Sem deteção de login de novo dispositivo/locação suspeita. |
| 16 | **Account recovery** | ❌ FALTA | Sem fluxo de "esqueci password" com email de reset seguro (token de um uso, expiração curta). |
| 17 | **Email verification** | ❌ FALTA | Registo não requer verificação de email. Qualquer email funciona. |
| 18 | **Phone verification** | ❌ FALTA | Não há verificação de número de telefone (SMS OTP). Essencial para motoristas e entregadores. |

### Pagamentos & Wallet

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 19 | **PCI DSS compliance** | ❌ FALTA | Wallet guarda saldos mas não há separação de ambientes, auditoria de transações, ou compliance PCI. |
| 20 | **Idempotência de pagamentos** | ⚠️ PARCIAL | Multicaixa webhook tem idempotência (não credita duas vezes), mas outras operações de wallet podem não ter. |
| 21 | **Reconciliação de pagamentos** | ❌ FALTA | Sem job periódico que reconcilia estado do Multicaixa com estado interno. Sem deteção de discrepâncias. |
| 22 | **Escrow/Held funds** | ❌ FALTA | Pagamentos de serviços não usam escrow. Dinheiro vai direto ao fornecedor sem garantia de entrega. |
| 23 | **Withdrawal flow real** | ❌ FALTA | Withdrawal existe no código mas parece só decrementar saldo interno. Sem integração real com bancos/Multicaixa para levantamento. |
| 24 | **Transaction reversals** | ❌ FALTA | Sem capacidade de reverter transações em caso de fraude ou erro operacional. |
| 25 | **Fraud detection** | ❌ FALTA | Sem regras anti-fraude (velocity checks, geolocation mismatch, device fingerprint, etc.). |
| 26 | **KYC/AML** | ❌ FALTA | Sem verificação de identidade para utilizadores de wallet. Sem limites de transação por tier de KYC. |
| 27 | **Ledger imutável** | ⚠️ PARCIAL | WalletTransactionEntity guarda histórico mas permite updates. Deveria ser append-only. |

### Base de Dados

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 28 | **Indexes otimizados** | ⚠️ PARCIAL | Não vejo indexes definidos nas entities além das PKs. Queries por userId, status, etc. precisam de indexes. |
| 29 | **Soft deletes** | ❌ FALTA | Sem `deletedAt` nas entities. Dados são apagados permanentemente. |
| 30 | **Database replication** | ❌ FALTA | Postgres é single instance. Sem read replica para queries pesadas. |
| 31 | **Connection pooling** | ⚠️ PARCIAL | TypeORM tem pooling implícito mas não configurado explicitamente (max connections, idle timeout, etc.). |
| 32 | **Query performance monitoring** | ❌ FALTA | Sem slow query log configurado, sem análise de explain plans. |
| 33 | **Data retention policy** | ❌ FALTA | Sem política de retenção para logs, notificações push antigas, dados de tracking. |

### Infraestrutura & DevOps

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 34 | **CI/CD pipeline** | ❌ FALTA | Sem GitHub Actions/GitLab CI para build, test, deploy automatizado. |
| 35 | **Blue/green deployment** | ❌ FALTA | Sem estratégia de deploy zero-downtime. Docker compose stop/start causa indisponibilidade. |
| 36 | **Auto-scaling** | ❌ FALTA | Sem HPA (Kubernetes) ou auto-scaling groups (AWS/Azure). Backend é single instance. |
| 37 | **Load balancer** | ❌ FALTA | Nginx é reverse proxy mas não faz load balancing entre múltiplas instâncias do backend. |
| 38 | **CDN** | ❌ FALTA | Assets estáticos, imagens, avatares não usam CDN. Entregues diretamente do servidor. |
| 39 | **Container registry** | ❌ FALTA | Sem configuração de ECR/ACR/GCR para imagens Docker. |
| 40 | **Infra as Code** | ❌ FALTA | Sem Terraform/Pulumi/CloudFormation para provisionar infraestrutura. |
| 41 | **SSL auto-renewal** | ⚠️ PARCIAL | Nginx tem SSL mas sem certbot/LetsEncrypt auto-renewal configurado no Docker. |
| 42 | **DDoS protection** | ❌ FALTA | Sem CloudFlare/AWS Shield ou equivalente na frente. |
| 43 | **Log aggregation** | ❌ FALTA | Logs vão para stdout. Sem ELK, Loki, ou Datadog para centralizar e pesquisar logs. |
| 44 | **Distributed tracing** | ❌ FALTA | Sem Jaeger/Zipkin/OpenTelemetry para tracing de requests entre serviços. |

### Mobile

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 45 | **OTA updates (Expo)** | ⚠️ PARCIAL | Expo EAS Updates configurado? Não claro se há pipeline de OTA updates. |
| 46 | **Crash reporting** | ❌ FALTA | Sem Sentry/Crashlytics configurado para capturar crashes em produção. |
| 47 | **Deep linking** | ⚠️ PARCIAL | Expo tem deep linking mas não vejo configuração de universal links/app links. |
| 48 | **Push notifications FCM/APNs** | ⚠️ PARCIAL | Expo Push funciona mas não há fallback para FCM direto ou APNs para notificações críticas. |
| 49 | **App store compliance** | ❌ FALTA | Sem política de privacidade, termos de uso, ecrãs de onboarding legalmente exigidos. |
| 50 | **Biometric auth** | ❌ FALTA | Sem login com Face ID/Touch ID/ fingerprint para apps mobile. |

---

## 🟡 P1 — IMPORTANTE (Degrada experiência ou aumenta risco)

### Funcionalidades de Negócio

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 51 | **Real-time tracking** | ⚠️ PARCIAL | RidesEventsService existe mas não vejo integração com Google Maps/Mapbox para tracking GPS real. |
| 52 | **Geofencing** | ❌ FALTA | Sem limitação de áreas de operação. Motoristas podem aceitar corridas em qualquer lugar. |
| 53 | **Dynamic pricing** | ❌ FALTA | Preços são fixos. Sem surge pricing baseado em demanda, hora, clima, distância real. |
| 54 | **Driver onboarding** | ❌ FALTA | Sem fluxo de verificação de documentos (cartão de identidade, carta de condução, seguro, foto). |
| 55 | **Vendor onboarding** | ❌ FALTA | Sem verificação de comércio (NIF, licença comercial, inspeção sanitária). |
| 56 | **Ratings & reviews** | ❌ FALTA | Sem sistema de avaliação de motoristas, lojistas, e utilizadores. |
| 57 | **Dispute resolution** | ❌ FALTA | Sem sistema de disputas para corridas/pedidos problemáticos. |
| 58 | **Cancellation fees** | ❌ FALTA | Sem política de taxas de cancelamento. |
| 59 | **Promo codes & discounts** | ❌ FALTA | Sem sistema de cupões, vouchers, e campanhas promocionais. |
| 60 | **Referral program** | ❌ FALTA | Sem sistema de indicação com recompensas. |
| 61 | **Multi-language** | ❌ FALTA | Só português. Sem internacionalização (i18n) para outros mercados. |
| 62 | **Admin dashboard** | ⚠️ PARCIAL | web-admin existe mas não está claro se tem funcionalidades de gestão completas (usuários, transações, disputes, analytics). |
| 63 | **Reporting & analytics** | ❌ FALTA | Sem relatórios de negócio (receita, comissões, growth metrics) para admin. |
| 64 | **Driver earnings** | ⚠️ PARCIAL | Wallet existe mas não há separação clara de comissões da plataforma vs. ganhos do motorista. |
| 65 | **Scheduled rides** | ❌ FALTA | Sem agendamento de corridas para data/hora futura. |
| 66 | **Multi-stop rides** | ❌ FALTA | Corridas só suportam origem + destino. Sem múltiplas paradas. |
| 67 | **Group orders** | ❌ FALTA | Pedidos de lojas são individuais. Sem "dividir conta" ou pedidos em grupo. |

### Observabilidade

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 68 | **Log correlation** | ❌ FALTA | Cada request tem requestId mas não vejo propagation para todos os serviços (DB queries, Redis, etc.). |
| 69 | **Structured logging** | ⚠️ PARCIAL | NestJS Logger é básico. Sem JSON logging para consumo por ELK/Loki. |
| 70 | **Error tracking** | ❌ FALTA | Sem Sentry/Rollbar/bugsnag para capturar e agrupar erros automaticamente. |
| 71 | **Synthetic monitoring** | ❌ FALTA | Sem checks periódicos (Pingdom/UptimeRobot) de endpoints críticos de fora. |
| 72 | **APM** | ❌ FALTA | Sem New Relic/Datadog/Dynatrace para performance monitoring de queries, external calls, etc. |

### Frontend Web

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 73 | **SEO** | ⚠️ PARCIAL | Next.js tem SSR mas não vejo meta tags, structured data, sitemap, robots.txt configurados. |
| 74 | **PWA** | ❌ FALTA | Sem service worker, manifest.json, offline capability. |
| 75 | **Accessibility (a11y)** | ❌ FALTA | Sem testes de acessibilidade (axe, Lighthouse a11y audit). |
| 76 | **Performance budget** | ❌ FALTA | Sem limites de bundle size, Core Web Vitals monitoring. |
| 77 | **Error boundaries** | ⚠️ PARCIAL | React error boundaries não implementados nos apps web. |

### Testing

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 78 | **Unit test coverage** | ⚠️ PARCIAL | Alguns testes existem mas cobertura provavelmente < 50%. |
| 79 | **Integration tests** | ⚠️ PARCIAL | Testes e2e existem mas não cobrem todos os fluxos críticos (pagamento, wallet, push). |
| 80 | **Load testing** | ❌ FALTA | Sem k6/Artillery/JMeter para testar carga do backend. |
| 81 | **Chaos engineering** | ❌ FALTA | Sem testes de resiliência (matar containers, simular network partition). |
| 82 | **Contract testing** | ❌ FALTA | Sem Pact ou similar para garantir compatibilidade entre frontend e backend. |
| 83 | **Visual regression** | ❌ FALTA | Sem Percy/Chromatic para testes visuais. |
| 84 | **Mobile E2E** | ❌ FALTA | Sem Detox/Appium/Maestro para testes end-to-end nos apps mobile. |

---

## 🟢 P2 — NICE-TO-HAVE (Melhoria contínua)

| # | Item | Estado | Detalhe |
|---|------|--------|---------|
| 85 | **GraphQL** | ❌ FALTA | REST API funcional mas GraphQL poderia reduzir over-fetching nos apps mobile. |
| 86 | **Feature flags** | ❌ FALTA | Sem LaunchDarkly/unleash para rollout gradual de funcionalidades. |
| 87 | **AB testing** | ❌ FALTA | Sem infraestrutura para testar variações de UI/UX. |
| 88 | **Chat in-app** | ❌ FALTA | Sem chat entre motorista-passageiro ou lojista-cliente. |
| 89 | **Voice calls** | ❌ FALTA | Sem máscara de telefone (Twilio) para proteger privacidade. |
| 90 | **Dark mode** | ❌ FALTA | Apps não suportam tema escuro. |
| 91 | **Offline mode** | ❌ FALTA | Apps mobile não funcionam offline (sem cache de dados, sem queue de ações). |
| 92 | **AI/ML recommendations** | ❌ FALTA | Sem recomendação de restaurantes, rotas otimizadas, previsão de ETA. |

---

## Recomendações Imediatas (Próximos 30 dias)

### Semana 1-2: Segurança & Auth
1. Implementar **2FA via SMS/Email** para login e operações de wallet
2. Adicionar **password policy** (12 chars, complexidade, breached check)
3. Configurar **secrets management** (HashiCorp Vault ou AWS Secrets Manager)
4. Implementar **brute force protection** (lockout, CAPTCHA)
5. Adicionar **email verification** no registo
6. Configurar **SSL auto-renewal** com LetsEncrypt

### Semana 3-4: Pagamentos & Compliance
7. Implementar **KYC tiers** (básico/verificado) com limites de transação
8. Adicionar **fraud detection rules** (velocity, geolocation, device)
9. Implementar **escrow** para pagamentos de serviços
10. Criar **reconciliation job** diário para pagamentos Multicaixa
11. Adicionar **soft deletes** em todas as entities
12. Criar **data retention policies**

### Semana 5-8: Infraestrutura & DevOps
13. Configurar **CI/CD pipeline** (GitHub Actions)
14. Implementar **blue/green deployment**
15. Adicionar **log aggregation** (Loki + Grafana)
16. Configurar **error tracking** (Sentry)
17. Implementar **load balancer** com múltiplas instâncias
18. Adicionar **CDN** para assets

---

## Checklist Rápido de Go/No-Go para Produção

- [ ] 2FA/MFA implementado
- [ ] Secrets management configurado
- [ ] SSL/TLS com auto-renewal
- [ ] Rate limiting + DDoS protection
- [ ] KYC/AML básico implementado
- [ ] Fraud detection ativo
- [ ] Escrow para pagamentos
- [ ] CI/CD pipeline funcional
- [ ] Blue/green deployment
- [ ] Log aggregation + error tracking
- [ ] Load balancer + auto-scaling
- [ ] Testes de carga passados
- [ ] Penetration test concluído
- [ ] Disaster recovery plano documentado
- [ ] GDPR/LGPD compliance review
- [ ] Mobile apps publicados nas stores
- [ ] Termos de uso e política de privacidade publicados
- [ ] Suporte ao cliente configurado
- [ ] Runbooks criados para incidentes comuns
- [ ] On-call rotation definida

**Atual: ~5/20 ✅**

---

## Estimativa de Esforço Total

| Fase | Itens | Esforço Estimado |
|------|-------|------------------|
| P0 — Crítico | ~43 itens | 3-4 meses (2-3 devs) |
| P1 — Importante | ~41 itens | 2-3 meses (2-3 devs) |
| P2 — Nice-to-have | ~8 itens | 1-2 meses (1-2 devs) |
| **Total** | **~92 itens** | **6-9 meses (equipa de 3-4 devs)** |

---

*Este documento deve ser revisto mensalmente e atualizado conforme o progresso do projeto.*
