import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MulticaixaReferenceEntity } from '../database/entities/multicaixa-reference.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { SettingsModule } from '../settings/settings.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MulticaixaReferenceEntity, WalletTransactionEntity]),
    SettingsModule,
    WalletModule,
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ReconciliationService],
  exports: [PaymentsService, ReconciliationService],
})
export class PaymentsModule {}
