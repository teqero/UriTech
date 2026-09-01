import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DEMO_INSURERS } from '@uritech/shared';
import { Repository } from 'typeorm';
import { DEFAULT_ORIGIN } from '@uritech/shared';
import { isDatabaseEnabled } from './database.config';
import { InsurerEntity } from './entities/insurer.entity';
import { OrderEntity } from './entities/order.entity';
import { RideEntity } from './entities/ride.entity';
import { UserEntity } from './entities/user.entity';
import { WalletEntity } from './entities/wallet.entity';

const DEMO_USERS: Omit<UserEntity, 'id' | 'createdAt'>[] = [
  { name: 'Admin UriTech', email: 'admin@uritech.com', phone: '+244923900000001', role: 'admin', password: '', emailVerified: true, twoFactorEnabled: false, failedLoginAttempts: 0, kycTier: 'verified', kycStatus: 'approved' },
  { name: 'João Silva', email: 'joao@uritech.com', phone: '+244923456789', role: 'user', password: '', emailVerified: true, twoFactorEnabled: false, failedLoginAttempts: 0, kycTier: 'basic', kycStatus: 'approved' },
  { name: 'Maria Santos', email: 'maria@uritech.com', phone: '+244912345678', role: 'user', password: '', emailVerified: true, twoFactorEnabled: false, failedLoginAttempts: 0, kycTier: 'verified', kycStatus: 'approved' },
  { name: 'Budi Santoso', email: 'budi@uritech.com', phone: '+244912111222', role: 'driver', password: '', emailVerified: true, twoFactorEnabled: false, failedLoginAttempts: 0, kycTier: 'verified', kycStatus: 'approved' },
  {
    name: 'Kero Kilamba',
    email: 'warung@uritech.com',
    phone: '+244923333444',
    role: 'vendor',
    vendorSubtype: 'supermarket',
    password: '',
    emailVerified: true,
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    kycTier: 'premium',
    kycStatus: 'approved',
  },
  {
    name: 'Carlos Entregador',
    email: 'entregador@uritech.com',
    phone: '+244923555666',
    role: 'delivery_rider',
    password: '',
    emailVerified: true,
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    kycTier: 'basic',
    kycStatus: 'approved',
  },
];

@Injectable()
export class DbSeedService implements OnModuleInit {
  private readonly logger = new Logger(DbSeedService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(RideEntity) private readonly ridesRepo: Repository<RideEntity>,
    @InjectRepository(OrderEntity) private readonly ordersRepo: Repository<OrderEntity>,
    @InjectRepository(InsurerEntity) private readonly insurersRepo: Repository<InsurerEntity>,
    @InjectRepository(WalletEntity) private readonly walletsRepo: Repository<WalletEntity>,
  ) {}

  async onModuleInit() {
    if (!isDatabaseEnabled()) return;

    const count = await this.usersRepo.count();
    if (count > 0) {
      this.logger.log(`Base de dados pronta (${count} utilizadores)`);
      return;
    }

    this.logger.log('A popular dados demo…');
    const hash = await bcrypt.hash('demo123', 10);

    await this.insurersRepo.save(
      DEMO_INSURERS.map((i) =>
        this.insurersRepo.create({
          id: i.id,
          name: i.name,
          code: i.code,
          contactEmail: i.contactEmail,
          contactPhone: i.contactPhone,
          apiWebhookUrl: i.apiWebhookUrl,
          platformFeePerClaim: i.platformFeePerClaim,
          platformFeeMonthly: i.platformFeeMonthly,
          active: i.active,
          mandatedForClients: i.mandatedForClients,
          clientsCount: i.clientsCount,
          claimsThisMonth: i.claimsThisMonth,
        }),
      ),
    );

    const users = await this.usersRepo.save(
      DEMO_USERS.map((u) => this.usersRepo.create({ ...u, password: hash })),
    );

    const joao = users.find((u) => u.email === 'joao@uritech.com');
    const maria = users.find((u) => u.email === 'maria@uritech.com');
    const budi = users.find((u) => u.email === 'budi@uritech.com');
    const warung = users.find((u) => u.email === 'warung@uritech.com');
    const entregador = users.find((u) => u.email === 'entregador@uritech.com');

    if (joao && budi) {
      await this.ridesRepo.save(
        this.ridesRepo.create({
          userId: joao.id,
          driverId: budi.id,
          status: 'completed',
          mode: 'fixed',
          pickup: DEFAULT_ORIGIN,
          destination: {
            latitude: -8.8383,
            longitude: 13.2344,
            address: 'Hotel Epic Sana, Luanda',
            city: 'Luanda',
            province: 'Luanda',
            country: 'Angola',
          },
          fare: 1200,
          distance: 5400,
          duration: 1080,
          vehicleType: 'standard',
        }),
      );
    }

    if (joao && warung && maria) {
      const pickup = {
        latitude: -8.918,
        longitude: 13.303,
        address: 'Kero Kilamba',
        city: 'Luanda',
      };
      const delivery = {
        latitude: -8.916,
        longitude: 13.366,
        address: 'Talatona',
        city: 'Luanda',
      };

      await this.ordersRepo.save([
        this.ordersRepo.create({
          userId: joao.id,
          vendorId: warung.id,
          serviceType: 'lojas',
          status: 'pending',
          items: [{ menuItemId: '1', name: 'Arroz Tio João (5kg)', quantity: 1, price: 3500 }],
          total: 4850,
          deliveryFee: 500,
          pickupLocation: pickup,
          deliveryLocation: delivery,
        }),
        this.ordersRepo.create({
          userId: maria.id,
          vendorId: warung.id,
          serviceType: 'lojas',
          status: 'pending',
          items: [{ menuItemId: '2', name: 'Leite Mimosa (6un)', quantity: 1, price: 1700 }],
          total: 2200,
          deliveryFee: 500,
          pickupLocation: pickup,
          deliveryLocation: delivery,
        }),
        this.ordersRepo.create({
          userId: joao.id,
          vendorId: warung.id,
          serviceType: 'lojas',
          status: 'preparing',
          items: [{ menuItemId: '3', name: 'Frango Congelado (2kg)', quantity: 1, price: 2100 }],
          total: 2100,
          deliveryFee: 0,
          pickupLocation: pickup,
          deliveryLocation: delivery,
        }),
        this.ordersRepo.create({
          userId: maria.id,
          vendorId: warung.id,
          driverId: entregador?.id,
          serviceType: 'lojas',
          status: 'ready',
          items: [{ menuItemId: '4', name: 'Detergente, Esponjas', quantity: 1, price: 3200 }],
          total: 3200,
          deliveryFee: 0,
          pickupLocation: pickup,
          deliveryLocation: delivery,
        }),
        this.ordersRepo.create({
          userId: joao.id,
          vendorId: warung.id,
          driverId: entregador?.id ?? budi?.id,
          serviceType: 'lojas',
          status: 'delivered',
          items: [{ menuItemId: '5', name: 'Café, Açúcar', quantity: 1, price: 4100 }],
          total: 4100,
          deliveryFee: 0,
          pickupLocation: pickup,
          deliveryLocation: delivery,
        }),
      ]);
    }

    if (joao) {
      await this.walletsRepo.save(
        this.walletsRepo.create({ userId: joao.id, balance: 124500, currency: 'AOA' }),
      );
    }
    if (maria) {
      await this.walletsRepo.save(
        this.walletsRepo.create({ userId: maria.id, balance: 45000, currency: 'AOA' }),
      );
    }
    if (budi) {
      await this.walletsRepo.save(
        this.walletsRepo.create({ userId: budi.id, balance: 8200, currency: 'AOA' }),
      );
    }

    this.logger.log('Seed demo concluído (palavra-passe: demo123)');
  }
}
