import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { CatalogService } from './catalog.service';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [ServicesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class ServicesModule {}
