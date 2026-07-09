import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { RidesModule } from './rides/rides.module';
import { VendorsModule } from './vendors/vendors.module';
import { DriversModule } from './drivers/drivers.module';
import { ServicesModule } from './services/services.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { InsurersModule } from './insurers/insurers.module';
import { ClaimEvidenceModule } from './claim-evidence/claim-evidence.module';
import { WalletModule } from './wallet/wallet.module';
import { DatabaseModule } from './database/database.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule.register(),
    AuthModule,
    UsersModule,
    OrdersModule,
    RidesModule,
    VendorsModule,
    DriversModule,
    ServicesModule,
    SettingsModule,
    PaymentsModule,
    InsurersModule,
    ClaimEvidenceModule,
    WalletModule,
    NotificationsModule,
  ],
})
export class AppModule {}
