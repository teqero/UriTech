import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { isDatabaseEnabled } from '../database/database.config';
import { OrderEntity } from '../database/entities/order.entity';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WalletModule,
    NotificationsModule,
    ...(isDatabaseEnabled() ? [TypeOrmModule.forFeature([OrderEntity])] : []),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
