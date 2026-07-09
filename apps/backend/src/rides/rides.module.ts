import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { isDatabaseEnabled } from '../database/database.config';
import { RideEntity } from '../database/entities/ride.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    NotificationsModule,
    ...(isDatabaseEnabled() ? [TypeOrmModule.forFeature([RideEntity])] : []),
  ],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
