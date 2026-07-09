import { Injectable, NotFoundException, Optional } from '@nestjs/common';
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
import { isDatabaseEnabled } from '../database/database.config';
import { OrderEntity } from '../database/entities/order.entity';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import type { StoreCheckoutDto } from './dto/store-checkout.dto';

@Injectable()
export class OrdersService {
  private memoryOrders: Order[] = [
    {
      id: '1',
      userId: '2',
      vendorId: '5',
      driverId: '4',
      serviceType: 'lojas',
      status: 'in_transit',
      items: [{ menuItemId: '1', name: 'Nasi Goreng', quantity: 2, price: 25 }],
      total: 66,
      deliveryFee: 8,
      pickupLocation: { latitude: -8.918, longitude: 13.303, address: 'Kero Kilamba' },
      deliveryLocation: { latitude: -8.916, longitude: 13.366, address: 'Talatona' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: '3',
      vendorId: '5',
      serviceType: 'lojas',
      status: 'ready',
      items: [{ menuItemId: '4', name: 'Detergente, Esponjas', quantity: 1, price: 3200 }],
      total: 3200,
      deliveryFee: 500,
      pickupLocation: { latitude: -8.918, longitude: 13.303, address: 'Kero Kilamba' },
      deliveryLocation: { latitude: -8.916, longitude: 13.366, address: 'Talatona' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    @Optional()
    @InjectRepository(OrderEntity)
    private readonly ordersRepo?: Repository<OrderEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.ordersRepo;
  }

  private toOrder(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.userId,
      vendorId: entity.vendorId,
      driverId: entity.driverId,
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
    if (this.useDb) {
      const rows = await this.ordersRepo!.find({ order: { createdAt: 'DESC' } });
      return rows.map((o) => this.toOrder(o));
    }
    return this.memoryOrders;
  }

  async findById(id: string) {
    if (this.useDb) {
      const row = await this.ordersRepo!.findOne({ where: { id } });
      return row ? this.toOrder(row) : undefined;
    }
    return this.memoryOrders.find((o) => o.id === id);
  }

  async findByUser(userId: string) {
    if (this.useDb) {
      const rows = await this.ordersRepo!.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      return rows.map((o) => this.toOrder(o));
    }
    return this.memoryOrders.filter((o) => o.userId === userId);
  }

  async findByVendor(vendorId: string) {
    if (this.useDb) {
      const rows = await this.ordersRepo!.find({
        where: { vendorId },
        order: { createdAt: 'DESC' },
      });
      return rows.map((o) => this.toOrder(o));
    }
    return this.memoryOrders.filter((o) => o.vendorId === vendorId);
  }

  async findByRider(driverId: string) {
    if (this.useDb) {
      const rows = await this.ordersRepo!.find({
        where: { driverId },
        order: { createdAt: 'DESC' },
      });
      return rows.map((o) => this.toOrder(o));
    }
    return this.memoryOrders.filter((o) => o.driverId === driverId);
  }

  async findAvailableForDelivery() {
    const available = (orders: Order[]) =>
      orders.filter((o) => o.status === 'ready' && !o.driverId);

    if (this.useDb) {
      const rows = await this.ordersRepo!.find({
        where: { status: 'ready' },
        order: { createdAt: 'DESC' },
      });
      return available(rows.map((o) => this.toOrder(o)));
    }
    return available(this.memoryOrders);
  }

  async checkoutService(userId: string, dto: ServiceCheckoutDto): Promise<Order> {
    const serviceType = resolveOrderServiceType(dto.serviceKey);
    const payWithWallet = dto.payWithWallet !== false;

    if (payWithWallet) {
      await this.walletService.pay(
        userId,
        dto.total,
        `Pedido ${dto.serviceName}`,
      );
    }

    const deliveryAddress =
      dto.destinationLabel?.trim() ||
      DEFAULT_ORIGIN.address ||
      'Destino — cliente UriGo';

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
      await this.walletService.pay(
        userId,
        dto.total,
        `Pedido loja — ${dto.storeName}`,
      );
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
    if (this.useDb) {
      const saved = await this.ordersRepo!.save(this.ordersRepo!.create(data));
      return this.toOrder(saved);
    }

    const order: Order = {
      ...data,
      id: String(this.memoryOrders.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryOrders.unshift(order);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, driverId?: string) {
    if (this.useDb) {
      const row = await this.ordersRepo!.findOne({ where: { id } });
      if (!row) return null;
      row.status = status;
      if (driverId) row.driverId = driverId;
      const saved = await this.ordersRepo!.save(row);
      return this.toOrder(saved);
    }

    const order = this.memoryOrders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    if (driverId) order.driverId = driverId;
    order.updatedAt = new Date().toISOString();
    return order;
  }
}
