import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [ServicesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class ServicesModule {}
