import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KycService, KycSubmission } from './kyc.service';
import { UserEntity, KycTier, KycStatus } from '../database/entities/user.entity';
import { WalletTransactionEntity } from '../database/entities/wallet-transaction.entity';
import { EmailService } from '../common/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KycAuditLogService } from './kyc-audit-log.service';

const mockUser: UserEntity = {
  id: 'user-1',
  name: 'João Teste',
  email: 'joao@uritech.com',
  phone: '+244923456789',
  password: 'hash',
  role: 'user',
  emailVerified: true,
  twoFactorEnabled: false,
  failedLoginAttempts: 0,
  kycTier: 'verified' as KycTier,
  kycStatus: 'approved' as KycStatus,
  createdAt: new Date(),
};

const mockUserUnverified: UserEntity = {
  ...mockUser,
  id: 'user-2',
  kycTier: 'unverified' as KycTier,
  kycStatus: 'pending' as KycStatus,
};

const mockUserBasic: UserEntity = {
  ...mockUser,
  id: 'user-3',
  kycTier: 'basic' as KycTier,
  kycStatus: 'approved' as KycStatus,
};

const mockUserExpired: UserEntity = {
  ...mockUser,
  id: 'user-4',
  kycTier: 'verified' as KycTier,
  kycStatus: 'approved' as KycStatus,
  kycExpiresAt: new Date(Date.now() - 86400000),
};

describe('KycService', () => {
  let service: KycService;
  let userStore: Map<string, UserEntity>;

  const mockUserRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data: any) => data),
  };

  const mockTxRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    })),
  };

  const mockEmailService = {
    send: jest.fn().mockResolvedValue(undefined),
    isConfigured: jest.fn().mockReturnValue(false),
  };

  const mockNotificationsService = {
    sendToUser: jest.fn().mockResolvedValue({ sent: 1 }),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    userStore = new Map();
    userStore.set('user-1', { ...mockUser });
    userStore.set('user-2', { ...mockUserUnverified });
    userStore.set('user-3', { ...mockUserBasic });
    userStore.set('user-4', { ...mockUserExpired });

    mockUserRepo.findOne.mockImplementation(({ where }: { where: { id?: string; email?: string } }) => {
      const id = where.id ?? '';
      const user = id ? userStore.get(id) : undefined;
      return Promise.resolve(user ? { ...user } : undefined);
    });

    mockUserRepo.update.mockImplementation((id: string, data: Partial<UserEntity>) => {
      const user = userStore.get(id);
      if (user) Object.assign(user, data);
      return Promise.resolve({});
    });

    mockUserRepo.findAndCount.mockResolvedValue([[], 0]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(WalletTransactionEntity), useValue: mockTxRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: KycAuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get(KycService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLimits', () => {
    it('retorna limites correctos para tier verified', () => {
      const limits = service.getLimits('verified');
      expect(limits.dailyTopUpLimit).toBe(500_000);
      expect(limits.dailyTransferLimit).toBe(250_000);
      expect(limits.dailyPaymentLimit).toBe(500_000);
      expect(limits.dailyWithdrawLimit).toBe(250_000);
      expect(limits.maxBalance).toBe(2_000_000);
    });

    it('retorna limites correctos para tier basic', () => {
      const limits = service.getLimits('basic');
      expect(limits.dailyTopUpLimit).toBe(50_000);
      expect(limits.maxBalance).toBe(200_000);
    });

    it('retorna zero para tier unverified', () => {
      const limits = service.getLimits('unverified');
      expect(limits.dailyTopUpLimit).toBe(0);
      expect(limits.dailyTransferLimit).toBe(0);
      expect(limits.dailyPaymentLimit).toBe(0);
      expect(limits.dailyWithdrawLimit).toBe(0);
      expect(limits.maxBalance).toBe(0);
    });
  });

  describe('getUserKycStatus', () => {
    it('retorna status completo do utilizador', async () => {
      const result = await service.getUserKycStatus('user-1');
      expect(result.tier).toBe('verified');
      expect(result.status).toBe('approved');
      expect(result.limits).toBeDefined();
      expect(result.userId).toBe('user-1');
    });

    it('lança erro se utilizador não encontrado', async () => {
      await expect(service.getUserKycStatus('inexistente')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('submitKyc', () => {
    const submission: KycSubmission = {
      documentType: 'bi',
      documentNumber: '006546782LA045',
      documentFrontUrl: 'https://storage.uritech.com/front.jpg',
      documentBackUrl: 'https://storage.uritech.com/back.jpg',
      selfieUrl: 'https://storage.uritech.com/selfie.jpg',
    };

    it('submete documentos com sucesso', async () => {
      await service.submitKyc('user-2', submission);
      const user = userStore.get('user-2');
      expect(user?.kycStatus).toBe('pending');
      expect(user?.kycDocumentType).toBe('bi');
      expect(user?.kycDocumentNumber).toBe('006546782LA045');
      expect(user?.kycSubmittedAt).toBeInstanceOf(Date);
      expect(mockAuditLogService.log).toHaveBeenCalled();
    });

    it('rejeita submissão se KYC já aprovado', async () => {
      await expect(service.submitKyc('user-1', submission)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejeita documento inválido (muito curto)', async () => {
      await expect(
        service.submitKyc('user-2', { ...submission, documentNumber: '123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('approveKyc', () => {
    it('aprova KYC com tier default (verified) e notifica', async () => {
      await service.submitKyc('user-2', {
        documentType: 'bi',
        documentNumber: '006546782LA045',
        documentFrontUrl: 'f',
        documentBackUrl: 'b',
        selfieUrl: 's',
      });

      await service.approveKyc('user-2', 'admin-1');
      const user = userStore.get('user-2');
      expect(user?.kycStatus).toBe('approved');
      expect(user?.kycTier).toBe('verified');
      expect(user?.kycVerifiedBy).toBe('admin-1');
      expect(user?.kycExpiresAt).toBeInstanceOf(Date);
      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockNotificationsService.sendToUser).toHaveBeenCalled();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyc_approve', performedBy: 'admin-1' }),
      );
    });

    it('aprova KYC com tier premium', async () => {
      await service.submitKyc('user-2', {
        documentType: 'bi',
        documentNumber: '006546782LA045',
        documentFrontUrl: 'f',
        documentBackUrl: 'b',
        selfieUrl: 's',
      });

      await service.approveKyc('user-2', 'admin-1', 'premium');
      const user = userStore.get('user-2');
      expect(user?.kycTier).toBe('premium');
    });

    it('rejeita aprovação se não há submissão pendente', async () => {
      await expect(service.approveKyc('user-1', 'admin-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('rejectKyc', () => {
    it('rejeita KYC com razão e notifica', async () => {
      await service.submitKyc('user-2', {
        documentType: 'bi',
        documentNumber: '006546782LA045',
        documentFrontUrl: 'f',
        documentBackUrl: 'b',
        selfieUrl: 's',
      });

      await service.rejectKyc('user-2', 'admin-1', 'Documento ilegível');
      const user = userStore.get('user-2');
      expect(user?.kycStatus).toBe('rejected');
      expect(user?.kycRejectionReason).toBe('Documento ilegível');
      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockNotificationsService.sendToUser).toHaveBeenCalled();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyc_reject', performedBy: 'admin-1' }),
      );
    });
  });

  describe('expireKyc', () => {
    it('expira KYC do utilizador e notifica', async () => {
      await service.expireKyc('user-1');
      const user = userStore.get('user-1');
      expect(user?.kycStatus).toBe('expired');
      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockNotificationsService.sendToUser).toHaveBeenCalled();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyc_expire' }),
      );
    });
  });

  describe('validateTransaction', () => {
    it('permite transação dentro do limite', async () => {
      await expect(
        service.validateTransaction('user-1', 'topup', 100_000),
      ).resolves.toBeUndefined();
    });

    it('rejeita transação acima do limite do tier', async () => {
      await expect(
        service.validateTransaction('user-1', 'topup', 1_000_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita transação se KYC não aprovado', async () => {
      await expect(
        service.validateTransaction('user-2', 'topup', 1000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita transação se KYC expirou', async () => {
      await expect(
        service.validateTransaction('user-4', 'topup', 1000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita transfer acima do limite diário', async () => {
      await expect(
        service.validateTransaction('user-1', 'transfer', 300_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita withdraw acima do limite', async () => {
      await expect(
        service.validateTransaction('user-1', 'withdraw', 300_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita payment acima do limite', async () => {
      await expect(
        service.validateTransaction('user-1', 'payment', 600_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('verifica limite diário acumulado', async () => {
      mockTxRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 480_000 }),
      });

      await expect(
        service.validateTransaction('user-1', 'topup', 50_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite transação dentro do limite acumulado restante', async () => {
      mockTxRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 100_000 }),
      });

      await expect(
        service.validateTransaction('user-1', 'topup', 50_000),
      ).resolves.toBeUndefined();
    });
  });

  describe('validateMaxBalance', () => {
    it('permite saldo dentro do limite', async () => {
      await expect(
        service.validateMaxBalance('user-1', 1_000_000),
      ).resolves.toBeUndefined();
    });

    it('rejeita saldo acima do máximo do tier', async () => {
      await expect(
        service.validateMaxBalance('user-1', 3_000_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita saldo acima do tier basic', async () => {
      await expect(
        service.validateMaxBalance('user-3', 250_000),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('renewKyc', () => {
    const submission: KycSubmission = {
      documentType: 'passport',
      documentNumber: 'AA123456',
      documentFrontUrl: 'https://storage.uritech.com/front.jpg',
      documentBackUrl: 'https://storage.uritech.com/back.jpg',
      selfieUrl: 'https://storage.uritech.com/selfie.jpg',
    };

    it('renova KYC expirado com sucesso', async () => {
      userStore.set('user-4', { ...mockUserExpired, kycStatus: 'expired' as KycStatus });

      await service.renewKyc('user-4', submission);
      const user = userStore.get('user-4');
      expect(user?.kycStatus).toBe('pending');
      expect(user?.kycDocumentType).toBe('passport');
      expect(user?.kycVerifiedAt).toBeUndefined();
      expect(user?.kycExpiresAt).toBeUndefined();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kyc_renew' }),
      );
    });

    it('renova KYC rejeitado com sucesso', async () => {
      userStore.set('user-5', { ...mockUser, id: 'user-5', kycStatus: 'rejected' as KycStatus, kycRejectionReason: 'Doc ilegível' });

      await service.renewKyc('user-5', submission);
      const user = userStore.get('user-5');
      expect(user?.kycStatus).toBe('pending');
      expect(user?.kycRejectionReason).toBeUndefined();
    });

    it('renova KYC aprovado (upgrade) com sucesso', async () => {
      await service.renewKyc('user-1', submission);
      const user = userStore.get('user-1');
      expect(user?.kycStatus).toBe('pending');
      expect(user?.kycDocumentType).toBe('passport');
    });

    it('rejeita renovação se KYC está pending', async () => {
      await expect(service.renewKyc('user-2', submission)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejeita documento inválido na renovação', async () => {
      userStore.set('user-6', { ...mockUser, id: 'user-6', kycStatus: 'expired' as KycStatus });
      await expect(
        service.renewKyc('user-6', { ...submission, documentNumber: '12' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findPendingKycs', () => {
    it('retorna KYCs pendentes paginados', async () => {
      const pendingUser = { ...mockUserUnverified, kycSubmittedAt: new Date() };
      mockUserRepo.findAndCount.mockResolvedValueOnce([[pendingUser], 1]);

      const result = await service.findPendingKycs(1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });
  });
});
