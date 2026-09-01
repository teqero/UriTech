import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycAuditLogEntity, KycAuditAction } from '../database/entities/kyc-audit-log.entity';

export interface KycAuditLogEntry {
  userId: string;
  action: KycAuditAction;
  performedBy?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class KycAuditLogService {
  constructor(
    @InjectRepository(KycAuditLogEntity)
    private readonly repo: Repository<KycAuditLogEntity>,
  ) {}

  async log(entry: KycAuditLogEntry): Promise<void> {
    await this.repo.save(
      this.repo.create({
        userId: entry.userId,
        action: entry.action,
        performedBy: entry.performedBy,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      }),
    );
  }
}
