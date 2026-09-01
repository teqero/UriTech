import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { KycService } from './kyc.service';

@Injectable()
export class KycCronService {
  private readonly logger = new Logger(KycCronService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly kycService: KycService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireKycsDaily(): Promise<void> {
    this.logger.log('Iniciando verificação diária de KYCs expirados...');

    const expiredUsers = await this.usersRepo.find({
      where: {
        kycStatus: 'approved',
        kycExpiresAt: LessThan(new Date()),
      },
      select: ['id', 'name', 'email', 'kycTier', 'kycExpiresAt'],
    });

    if (expiredUsers.length === 0) {
      this.logger.log('Nenhum KYC expirado encontrado.');
      return;
    }

    this.logger.log(`${expiredUsers.length} KYC(s) expirado(s) encontrado(s).`);

    for (const user of expiredUsers) {
      try {
        await this.kycService.expireKyc(user.id);
        this.logger.log(`KYC expirado automaticamente: user=${user.id}`);
      } catch (err) {
        this.logger.error(`Falha ao expirar KYC: user=${user.id}`, err instanceof Error ? err.message : err);
      }
    }

    this.logger.log('Verificação diária de KYCs concluída.');
  }
}
