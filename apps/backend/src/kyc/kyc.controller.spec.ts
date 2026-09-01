import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { StorageService } from '../storage/storage.service';
import { RedisService } from '../redis/redis.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';

describe('KycController', () => {
  let controller: KycController;
  let kycService: jest.Mocked<KycService>;
  let storageService: jest.Mocked<StorageService>;

  const mockKycService = {
    getAllLimits: jest.fn().mockReturnValue([
      { tier: 'unverified', dailyTopUpLimit: 0, maxBalance: 0 },
      { tier: 'basic', dailyTopUpLimit: 50_000, maxBalance: 200_000 },
      { tier: 'verified', dailyTopUpLimit: 500_000, maxBalance: 2_000_000 },
      { tier: 'premium', dailyTopUpLimit: 5_000_000, maxBalance: 50_000_000 },
    ]),
    getUserKycStatus: jest.fn().mockResolvedValue({
      userId: 'user-1',
      tier: 'verified',
      status: 'approved',
      limits: { dailyTopUpLimit: 500_000 },
    }),
    submitKyc: jest.fn().mockResolvedValue(undefined),
    renewKyc: jest.fn().mockResolvedValue(undefined),
    approveKyc: jest.fn().mockResolvedValue(undefined),
    rejectKyc: jest.fn().mockResolvedValue(undefined),
    findPendingKycs: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    }),
  };

  const mockStorageService = {
    generateKey: jest.fn().mockReturnValue('kyc/user-1/doc.jpg'),
    uploadFile: jest.fn().mockResolvedValue({
      key: 'kyc/user-1/doc.jpg',
      url: 'https://storage.uritech.com/kyc/user-1/doc.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
    }),
  };

  const mockRedisService = {
    increment: jest.fn().mockResolvedValue(1),
    getTtl: jest.fn().mockResolvedValue(3600),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycController],
      providers: [
        { provide: KycService, useValue: mockKycService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get(KycController);
    kycService = module.get(KycService) as any;
    storageService = module.get(StorageService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLimits', () => {
    it('retorna todos os limites por tier', () => {
      const result = controller.getLimits();
      expect(result).toHaveLength(4);
      expect(result[0].tier).toBe('unverified');
      expect(kycService.getAllLimits).toHaveBeenCalled();
    });
  });

  describe('getMyKycStatus', () => {
    it('retorna status KYC do utilizador autenticado', async () => {
      const result = await controller.getMyKycStatus('user-1');
      expect(result.tier).toBe('verified');
      expect(kycService.getUserKycStatus).toHaveBeenCalledWith('user-1');
    });
  });

  describe('submitKyc', () => {
    it('submete documentos KYC com sucesso', async () => {
      const dto: SubmitKycDto = {
        documentType: 'bi',
        documentNumber: '006546782LA045',
        documentFrontUrl: 'https://storage.uritech.com/front.jpg',
        documentBackUrl: 'https://storage.uritech.com/back.jpg',
        selfieUrl: 'https://storage.uritech.com/selfie.jpg',
      };

      const result = await controller.submitKyc('user-1', dto);
      expect(result.success).toBe(true);
      expect(kycService.submitKyc).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('renewKyc', () => {
    it('renova KYC com sucesso', async () => {
      const dto: SubmitKycDto = {
        documentType: 'passport',
        documentNumber: 'AA123456',
        documentFrontUrl: 'https://storage.uritech.com/front.jpg',
        documentBackUrl: 'https://storage.uritech.com/back.jpg',
        selfieUrl: 'https://storage.uritech.com/selfie.jpg',
      };

      const result = await controller.renewKyc('user-1', dto);
      expect(result.success).toBe(true);
      expect(kycService.renewKyc).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('uploadKycDocument', () => {
    it('faz upload de documento com sucesso', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'doc.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake'),
      };

      const result = await controller.uploadKycDocument('user-1', file as any);
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('lança BadRequestException se não há ficheiro', async () => {
      await expect(controller.uploadKycDocument('user-1', undefined as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lança BadRequestException se ficheiro demasiado grande', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'huge.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6 MB
        buffer: Buffer.alloc(6 * 1024 * 1024),
      };

      await expect(controller.uploadKycDocument('user-1', file as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lança BadRequestException se tipo de ficheiro não permitido', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'doc.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('fake-pdf'),
      };

      await expect(controller.uploadKycDocument('user-1', file as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getPendingKycs (admin)', () => {
    it('lista KYCs pendentes com paginação default', async () => {
      const result = await controller.getPendingKycs(1, 20);
      expect(result.items).toBeDefined();
      expect(kycService.findPendingKycs).toHaveBeenCalledWith(1, 20);
    });

    it('lista KYCs pendentes com paginação customizada', async () => {
      await controller.getPendingKycs(2, 10);
      expect(kycService.findPendingKycs).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('approveKyc (admin)', () => {
    it('aprova KYC com tier default', async () => {
      const dto: ApproveKycDto = {};
      const result = await controller.approveKyc('admin-1', 'user-2', dto);
      expect(result.success).toBe(true);
      expect(kycService.approveKyc).toHaveBeenCalledWith('user-2', 'admin-1', 'verified');
    });

    it('aprova KYC com tier premium', async () => {
      const dto: ApproveKycDto = { tier: 'premium' };
      await controller.approveKyc('admin-1', 'user-2', dto);
      expect(kycService.approveKyc).toHaveBeenCalledWith('user-2', 'admin-1', 'premium');
    });
  });

  describe('rejectKyc (admin)', () => {
    it('rejeita KYC com razão', async () => {
      const dto: RejectKycDto = { reason: 'Documento ilegível' };
      const result = await controller.rejectKyc('admin-1', 'user-2', dto);
      expect(result.success).toBe(true);
      expect(kycService.rejectKyc).toHaveBeenCalledWith('user-2', 'admin-1', 'Documento ilegível');
    });

    it('lança ForbiddenException se não há razão', async () => {
      const dto: RejectKycDto = { reason: '' };
      await expect(controller.rejectKyc('admin-1', 'user-2', dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
