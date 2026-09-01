import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { AlertsService } from './alerts.service';
import { AlertNotificationService } from './alert-notification.service';
import { HttpMetricsMiddleware } from './http-metrics.middleware';

@Module({
  providers: [MetricsService, AlertsService, AlertNotificationService, HttpMetricsMiddleware],
  controllers: [MetricsController],
  exports: [MetricsService, AlertsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMetricsMiddleware)
      .exclude('metrics')
      .forRoutes('*');
  }
}
