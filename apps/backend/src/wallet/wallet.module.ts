import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { isDatabaseEnabled } from '../database/database.config';
import { WalletEntity } from '../database/entities/wallet.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { UsersModule } from '../users/users.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ...(isDatabaseEnabled()
      ? [TypeOrmModule.forFeature([WalletEntity, WalletTransactionEntity])]
      : []),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
