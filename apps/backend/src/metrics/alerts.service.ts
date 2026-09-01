import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { MetricsService } from './metrics.service';
import { AlertNotificationService } from './alert-notification.service';
import { UserEntity } from '../database/entities/user.entity';
import { RideEntity } from '../database/entities/ride.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { WalletEntity } from '../database/entities/wallet.entity';

interface AlertThreshold {
  name: string;
  condition: (value: number) => boolean;
  title: string;
  message: string;
  severity: 'warning' | 'critical';
}

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsService.name);
  private lastAlertTime = new Map<string, number>();
  private readonly ALERT_COOLDOWN_MS = 5 * 60 * 1000;

  private readonly thresholds: AlertThreshold[] = [
    {
      name: 'high_error_rate',
      condition: (v) => v > 5,
      title: 'Taxa de erro HTTP elevada',
      message: 'A taxa de erro HTTP está acima de 5%: {value}%',
      severity: 'critical',
    },
    {
      name: 'high_latency_p95',
      condition: (v) => v > 1000,
      title: 'Latência P95 elevada',
      message: 'A latência P95 está acima de 1 segundo: {value}ms',
      severity: 'warning',
    },
    {
      name: 'low_active_users',
      condition: (v) => v < 10,
      title: 'Poucos utilizadores ativos',
      message: 'Menos de 10 utilizadores registados: {value}',
      severity: 'warning',
    },
  ];

  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  constructor(
    private readonly dataSource: DataSource,
    private readonly metricsService: MetricsService,
    private readonly notificationService: AlertNotificationService,
  ) {}

  onModuleInit() {
    this.logger.log('AlertsService iniciado');
  }

  recordRequest(durationMs: number, statusCode: number) {
    this.requestCount++;
    this.responseTimes.push(durationMs);

    if (statusCode >= 500) {
      this.errorCount++;
    }

    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  @Interval(60000)
  async checkMetrics() {
    try {
      await this.updateBusinessMetrics();
      await this.checkThresholds();

      this.requestCount = 0;
      this.errorCount = 0;
      this.responseTimes = [];
    } catch (err) {
      this.logger.error('Erro ao verificar métricas', err);
    }
  }

  private async updateBusinessMetrics() {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const rideRepo = this.dataSource.getRepository(RideEntity);
    const orderRepo = this.dataSource.getRepository(OrderEntity);
    const walletRepo = this.dataSource.getRepository(WalletEntity);

    const [activeUsers, activeRides, activeOrders, totalBalance] = await Promise.all([
      userRepo.count(),
      rideRepo.count({ where: { status: 'in_progress' as any } }),
      orderRepo.count({ where: { status: 'pending' as any } }),
      walletRepo.createQueryBuilder('w').select('COALESCE(SUM(w.balance), 0)', 'total').getRawOne(),
    ]);

    this.metricsService.activeUsers.set(activeUsers);
    this.metricsService.activeRides.set(activeRides);
    this.metricsService.activeOrders.set(activeOrders);
    this.metricsService.walletBalanceTotal.set(Number(totalBalance?.total || 0));
  }

  private async checkThresholds() {
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    await this.evaluateThreshold('high_error_rate', errorRate, { errorRate: errorRate.toFixed(2) });

    const p95 = this.calculateP95();
    await this.evaluateThreshold('high_latency_p95', p95, { p95Latency: p95.toFixed(2) });
  }

  private calculateP95(): number {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  private async evaluateThreshold(
    thresholdName: string,
    value: number,
    metadata?: Record<string, unknown>,
  ) {
    const threshold = this.thresholds.find((t) => t.name === thresholdName);
    if (!threshold) return;

    if (!threshold.condition(value)) return;

    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(thresholdName) || 0;
    if (now - lastAlert < this.ALERT_COOLDOWN_MS) return;

    this.lastAlertTime.set(thresholdName, now);

    const message = threshold.message.replace('{value}', String(Math.round(value * 100) / 100));
    this.logger.warn(`[ALERTA ${threshold.severity.toUpperCase()}] ${message}`);

    await this.notificationService.send({
      severity: threshold.severity,
      title: threshold.title,
      message,
      timestamp: new Date(),
      metadata,
    });
  }
}
