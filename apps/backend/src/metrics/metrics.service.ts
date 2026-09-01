import { Injectable, Logger } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly register: client.Registry;

  // Métricas HTTP
  readonly httpRequestsTotal: client.Counter;
  readonly httpRequestDuration: client.Histogram;

  // Métricas de health
  readonly healthCheckStatus: client.Gauge;
  readonly healthCheckDuration: client.Histogram;

  // Métricas de negócio
  readonly activeUsers: client.Gauge;
  readonly activeRides: client.Gauge;
  readonly activeOrders: client.Gauge;
  readonly walletBalanceTotal: client.Gauge;

  constructor() {
    this.register = new client.Registry();

    // Collect métricas default do Node.js (CPU, memória, event loop, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // HTTP requests counter
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total de requests HTTP',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração dos requests HTTP em segundos',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    // Health check status gauge
    this.healthCheckStatus = new client.Gauge({
      name: 'health_check_status',
      help: 'Estado do health check (1=up, 0=down)',
      labelNames: ['service'],
      registers: [this.register],
    });

    // Health check duration
    this.healthCheckDuration = new client.Histogram({
      name: 'health_check_duration_seconds',
      help: 'Duração dos health checks em segundos',
      labelNames: ['service'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
      registers: [this.register],
    });

    // Business metrics
    this.activeUsers = new client.Gauge({
      name: 'active_users_total',
      help: 'Número de utilizadores ativos',
      registers: [this.register],
    });

    this.activeRides = new client.Gauge({
      name: 'active_rides_total',
      help: 'Número de viagens em curso',
      registers: [this.register],
    });

    this.activeOrders = new client.Gauge({
      name: 'active_orders_total',
      help: 'Número de pedidos em curso',
      registers: [this.register],
    });

    this.walletBalanceTotal = new client.Gauge({
      name: 'wallet_balance_total_aoa',
      help: 'Saldo total em todas as carteiras (AOA)',
      registers: [this.register],
    });
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
