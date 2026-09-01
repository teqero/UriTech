import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Order, OrderStatus } from '@uritech/shared';
import {
  DEFAULT_ORIGIN,
  STORE_PICKUP_LOCATIONS,
  STORE_VENDOR_EMAIL,
  resolveOrderServiceType,
} from '@uritech/shared';
import type { ServiceCheckoutDto } from './dto/service-checkout.dto';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities/order.entity';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import type { StoreCheckoutDto } from './dto/store-checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    @InjectRepository(OrderEntity)
    private readonly ordersRepo: Repository<OrderEntity>,
  ) {}

  private toOrder(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.userId,
      vendorId: entity.vendorId ?? undefined,
      driverId: entity.driverId ?? undefined,
      serviceType: entity.serviceType,
      status: entity.status,
      items: entity.items,
      total: Number(entity.total),
      deliveryFee: Number(entity.deliveryFee),
      pickupLocation: entity.pickupLocation,
      deliveryLocation: entity.deliveryLocation,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async findAll() {
    const rows = await this.ordersRepo.find({ order: { createdAt: 'DESC' } });
    return rows.map((o) => this.toOrder(o));
  }

  async findById(id: string) {
    const row = await this.ordersRepo.findOne({ where: { id } });
    return row ? this.toOrder(row) : undefined;
  }

  async findByUser(userId: string) {
    const rows = await this.ordersRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((o) => this.toOrder(o));
  }

  async findByVendor(vendorId: string) {
    const rows = await this.ordersRepo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((o) => this.toOrder(o));
  }

  async findByRider(driverId: string) {
    const rows = await this.ordersRepo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((o) => this.toOrder(o));
  }

  async findAvailableForDelivery() {
    const rows = await this.ordersRepo.find({
      where: { status: 'ready' },
      order: { createdAt: 'DESC' },
    });
    return rows.map((o) => this.toOrder(o)).filter((o) => !o.driverId);
  }

  async checkoutService(userId: string, dto: ServiceCheckoutDto): Promise<Order> {
    const serviceType = resolveOrderServiceType(dto.serviceKey);
    const payWithWallet = dto.payWithWallet !== false;

    if (payWithWallet) {
      await this.walletService.pay(userId, dto.total, `Pedido ${dto.serviceName}`);
    }

    const deliveryAddress =
      dto.destinationLabel?.trim() || DEFAULT_ORIGIN.address || 'Destino — cliente UriGo';

    return this.create({
      userId,
      serviceType,
      status: 'pending',
      items: dto.items.map((item) => ({
        menuItemId: item.menuItemId ?? dto.serviceKey,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: dto.total,
      deliveryFee: dto.deliveryFee ?? 0,
      pickupLocation: {
        latitude: DEFAULT_ORIGIN.latitude,
        longitude: DEFAULT_ORIGIN.longitude,
        address: DEFAULT_ORIGIN.address ?? 'Recolha — cliente UriGo',
      },
      deliveryLocation: {
        latitude: DEFAULT_ORIGIN.latitude,
        longitude: DEFAULT_ORIGIN.longitude,
        address: deliveryAddress,
      },
    });
  }

  async checkoutStore(userId: string, dto: StoreCheckoutDto): Promise<Order> {
    const vendorEmail = STORE_VENDOR_EMAIL[dto.storeId];
    if (!vendorEmail) throw new NotFoundException('Loja não encontrada');

    const vendor = await this.usersService.findByEmail(vendorEmail);
    if (!vendor) throw new NotFoundException('Vendedor da loja não encontrado');

    const payWithWallet = dto.payWithWallet !== false;
    if (payWithWallet) {
      await this.walletService.pay(userId, dto.total, `Pedido loja — ${dto.storeName}`);
    }

    const pickup =
      STORE_PICKUP_LOCATIONS[dto.storeId] ??
      ({ latitude: -8.918, longitude: 13.303, address: dto.storeName } as const);

    return this.create({
      userId,
      vendorId: vendor.id,
      serviceType: 'lojas',
      status: 'pending',
      items: dto.items.map((item) => ({
        menuItemId: item.menuItemId ?? dto.storeId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: dto.total,
      deliveryFee: dto.deliveryFee,
      pickupLocation: pickup,
      deliveryLocation: {
        latitude: DEFAULT_ORIGIN.latitude,
        longitude: DEFAULT_ORIGIN.longitude,
        address: DEFAULT_ORIGIN.address ?? 'Entrega — cliente UriGo',
      },
    });
  }

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const saved = await this.ordersRepo.save(this.ordersRepo.create(data));
    return this.toOrder(saved);
  }

  async updateStatus(id: string, status: OrderStatus, driverId?: string) {
    const row = await this.ordersRepo.findOne({ where: { id } });
    if (!row) return null;
    row.status = status;
    if (driverId) row.driverId = driverId;
    const saved = await this.ordersRepo.save(row);
    return this.toOrder(saved);
  }
}
