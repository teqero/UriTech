import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';
import { AlertsService } from './alerts.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const route = this.getRoute(req);

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const status = res.statusCode.toString();
      const method = req.method;

      this.metricsService.httpRequestsTotal.inc({ method, route, status });
      this.metricsService.httpRequestDuration.observe({ method, route, status }, duration);

      this.alertsService.recordRequest(Date.now() - start, res.statusCode);
    });

    next();
  }

  private getRoute(req: Request): string {
    // Usar o path original ou route pattern se disponível
    const route = req.route?.path || req.path;
    // Normalizar IDs para evitar cardinality explosion
    return route
      .replace(/\/api\/v1\/[^/]+\/\d+/g, (match: string) => match.replace(/\d+$/, ':id'))
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid');
  }
}
