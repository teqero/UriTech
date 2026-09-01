import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';

export interface AuditLogEntry {
  userId: string;
  action: AuditLogEntity['action'];
  amount: number;
  balanceAfter?: number;
  description?: string;
  counterpartyEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.repo.save(
      this.repo.create({
        userId: entry.userId,
        action: entry.action,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        description: entry.description,
        counterpartyEmail: entry.counterpartyEmail,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
      }),
    );
  }
}
