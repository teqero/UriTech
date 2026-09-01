# Monitoramento e Alertas — UriTech

## Stack de Monitoramento

O backend expõe métricas Prometheus no endpoint `/metrics`. A stack completa inclui:

- **Prometheus** — coleta e armazena métricas
- **Grafana** — dashboards e visualização
- **AlertManager** — gestão de alertas (opcional)

## Métricas disponíveis

### Métricas de sistema (prom-client default)
- `process_cpu_user_seconds_total` — CPU usage
- `process_resident_memory_bytes` — Memória residente
- `nodejs_eventloop_lag_seconds` — Event loop lag
- `nodejs_active_handles_total` — Handles ativos

### Métricas HTTP customizadas
- `http_requests_total{method, route, status}` — Contador de requests
- `http_request_duration_seconds{method, route, status}` — Histogram de latência

### Métricas de Health
- `health_check_status{service}` — Estado dos serviços (1=up, 0=down)
- `health_check_duration_seconds{service}` — Duração dos health checks

### Métricas de negócio
- `active_users_total` — Número de utilizadores
- `active_rides_total` — Viagens em curso
- `active_orders_total` — Pedidos pendentes
- `wallet_balance_total_aoa` — Saldo total em carteiras

## Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /metrics` | Métricas Prometheus (público) |
| `GET /health` | Health check completo |
| `GET /health/ready` | Readiness probe |
| `GET /health/live` | Liveness probe |

## Alertas configurados

| Alerta | Condição | Severidade | Cooldown |
|--------|----------|------------|----------|
| `high_error_rate` | Taxa de erro > 5% | critical | 5 min |
| `high_latency_p95` | P95 > 1000ms | warning | 5 min |
| `low_active_users` | < 10 utilizadores | warning | 5 min |

## Uso com Docker

```bash
# Iniciar stack de monitoramento (Prometheus + Grafana)
docker compose -f deploy/docker-compose.monitoring.yml up -d

# Aceder interfaces
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000 (admin/admin)
```

## Queries úteis (PromQL)

```promql
# Taxa de requests por segundo
rate(http_requests_total[5m])

# P95 latência
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taxa de erro
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Memória do processo
process_resident_memory_bytes / 1024 / 1024

# Viagens em curso
active_rides_total
```

## Integração de alertas

O `AlertsService` está preparado para integrar com:

- **Email** — SendGrid / AWS SES
- **Slack** — Webhook incoming
- **SMS** — Twilio
- **PagerDuty** / **Opsgenie**

Para ativar, edite `apps/backend/src/metrics/alerts.service.ts` e implemente o método `sendAlert()`.

## Dashboards Grafana recomendados

1. **Overview** — Requests, latência, erros, uptime
2. **Infraestrutura** — CPU, memória, event loop, handles
3. **Negócio** — Utilizadores, viagens, pedidos, saldos
4. **Health** — Estado Postgres, Redis, MinIO
