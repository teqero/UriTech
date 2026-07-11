import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { isDatabaseEnabled } from '../database/database.config';
import { SocialPaymentEntity } from '../database/entities/social-payment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { AiEnrichmentService } from './services/ai-enrichment.service';
import { ImageService } from './services/image-service';
import { MetadataParserService } from './services/metadata-parser.service';
import { OpenGraphService } from './services/open-graph.service';
import { PlatformDetectorService } from './services/platform-detector.service';
import { SchemaParserService } from './services/schema-parser.service';
import { SocialImportEngine } from './services/social-import.engine';
import { SocialSyncService } from './services/social-sync.service';
import { SocialPaymentsController } from './social-payments.controller';
import { SocialPaymentsService } from './social-payments.service';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    OrdersModule,
    UsersModule,
    NotificationsModule,
    ...(isDatabaseEnabled() ? [TypeOrmModule.forFeature([SocialPaymentEntity])] : []),
  ],
  controllers: [SocialPaymentsController],
  providers: [
    SocialPaymentsService,
    SocialImportEngine,
    PlatformDetectorService,
    OpenGraphService,
    SchemaParserService,
    MetadataParserService,
    AiEnrichmentService,
    ImageService,
    SocialSyncService,
  ],
  exports: [SocialPaymentsService],
})
export class SocialPaymentsModule {}
