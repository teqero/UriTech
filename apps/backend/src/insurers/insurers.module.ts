import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { InsurerEntity } from '../database/entities/insurer.entity';
import { InsurersController } from './insurers.controller';
import { InsurersService } from './insurers.service';

@Module({
  imports: isDatabaseEnabled() ? [TypeOrmModule.forFeature([InsurerEntity])] : [],
  controllers: [InsurersController],
  providers: [InsurersService],
  exports: [InsurersService],
})
export class InsurersModule {}
