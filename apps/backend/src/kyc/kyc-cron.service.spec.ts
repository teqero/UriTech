import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KycCronService } from './kyc-cron.service';
import { KycService } from './kyc.service';
import { UserEntity } from '../database/entities/user.entity';

describe('KycCronService', () => {
  let service: KycCronService;
  let kycService: jest.Mocked<KycService>;
  let userRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const mockKycService = {
      expireKyc: jest.fn().mockResolvedValue(undefined),
    };

    const mockUserRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycCronService,
        { provide: KycService, useValue: mockKycService },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(KycCronService);
    kycService = module.get(KycService) as any;
    userRepo = module.get(getRepositoryToken(UserEntity)) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expireKycsDaily', () => {
    it('não faz nada se não há KYCs expirados', async () => {
      userRepo.find.mockResolvedValue([]);

      await service.expireKycsDaily();

      expect(userRepo.find).toHaveBeenCalled();
      expect(kycService.expireKyc).not.toHaveBeenCalled();
    });

    it('expira KYCs expirados automaticamente', async () => {
      const expiredUsers = [
        { id: 'user-1', name: 'João', email: 'joao@example.com', kycTier: 'verified', kycExpiresAt: new Date(Date.now() - 86400000) },
        { id: 'user-2', name: 'Maria', email: 'maria@example.com', kycTier: 'basic', kycExpiresAt: new Date(Date.now() - 172800000) },
      ];

      userRepo.find.mockResolvedValue(expiredUsers);

      await service.expireKycsDaily();

      expect(userRepo.find).toHaveBeenCalled();
      expect(kycService.expireKyc).toHaveBeenCalledTimes(2);
      expect(kycService.expireKyc).toHaveBeenCalledWith('user-1');
      expect(kycService.expireKyc).toHaveBeenCalledWith('user-2');
    });

    it('continua mesmo se um expirar falhar', async () => {
      const expiredUsers = [
        { id: 'user-1', name: 'João', email: 'joao@example.com', kycTier: 'verified', kycExpiresAt: new Date(Date.now() - 86400000) },
        { id: 'user-2', name: 'Maria', email: 'maria@example.com', kycTier: 'basic', kycExpiresAt: new Date(Date.now() - 172800000) },
      ];

      userRepo.find.mockResolvedValue(expiredUsers);
      kycService.expireKyc.mockRejectedValueOnce(new Error('DB error'));

      await service.expireKycsDaily();

      expect(kycService.expireKyc).toHaveBeenCalledTimes(2);
    });
  });
});
