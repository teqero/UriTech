import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
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
import { SocialPaymentsModule } from './social-payments/social-payments.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { KycModule } from './kyc/kyc.module';
import { RedisThrottlerStorage } from './common/guards/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 10,
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: 100,
        },
        {
          name: 'long',
          ttl: 3600000,
          limit: 1000,
        },
        {
          name: 'auth',
          ttl: 60000,
          limit: 5,
        },
      ],
    }),
    DatabaseModule.register(),
    RedisModule,
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
    SocialPaymentsModule,
    StorageModule,
    HealthModule,
    MetricsModule,
    KycModule,
  ],
  providers: [
    RedisThrottlerStorage,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // MetricsModule já configura o seu próprio middleware
  }
}
