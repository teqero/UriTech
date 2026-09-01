import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { HealthService, HealthCheckResult } from './health.service';

@SkipThrottle()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health Check', description: 'Verifica estado de Postgres, Redis e MinIO' })
  @ApiResponse({ status: 200, description: 'Todos os serviços disponíveis', type: Object })
  @ApiResponse({ status: 503, description: 'Um ou mais serviços indisponíveis' })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness Probe', description: 'Verifica se a app está pronta para receber tráfego' })
  @ApiResponse({ status: 200, description: 'Pronto' })
  @ApiResponse({ status: 503, description: 'Não pronto' })
  async ready(): Promise<{ ready: boolean; timestamp: string }> {
    const result = await this.healthService.check();
    return { ready: result.status !== 'unhealthy', timestamp: result.timestamp };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness Probe', description: 'Verifica se a app está viva (apenas processo)' })
  @ApiResponse({ status: 200, description: 'Vivo' })
  live(): { alive: boolean; timestamp: string } {
    return { alive: true, timestamp: new Date().toISOString() };
  }
}
