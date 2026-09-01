import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { isDatabaseEnabled } from '../database/database.config';
import { RideEntity } from '../database/entities/ride.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { RidesGateway } from './rides.gateway';
import { RidesEventsService } from './rides-events.service';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    NotificationsModule,
    EventEmitterModule.forRoot({ wildcard: false }),
    ...(isDatabaseEnabled() ? [TypeOrmModule.forFeature([RideEntity])] : []),
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway, RidesEventsService],
  exports: [RidesService, RidesEventsService],
})
export class RidesModule {}
