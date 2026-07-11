import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  ImportedSocialProduct,
  SocialPaymentCheckout,
  SocialPaymentRecord,
  SocialPaymentReceipt,
} from '@uritech/shared';
import { DEFAULT_ORIGIN } from '@uritech/shared';
import { Repository } from 'typeorm';
import { isDatabaseEnabled } from '../database/database.config';
import { SocialPaymentEntity } from '../database/entities/social-payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import type { CheckoutSocialPaymentDto } from './dto/social-payment.dto';
import { PlatformDetectorService } from './services/platform-detector.service';
import { SocialImportEngine } from './services/social-import.engine';
import { SocialSyncService } from './services/social-sync.service';

const SERVICE_FEE_RATE = 0.025;
const DELIVERY_FEES = { pickup: 0, urigo: 1500, none: 0 } as const;

@Injectable()
export class SocialPaymentsService {
  private memoryRecords: SocialPaymentRecord[] = [];

  constructor(
    private readonly importEngine: SocialImportEngine,
    private readonly platformDetector: PlatformDetectorService,
    private readonly syncService: SocialSyncService,
    private readonly walletService: WalletService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    @Optional()
    @InjectRepository(SocialPaymentEntity)
    private readonly repo?: Repository<SocialPaymentEntity>,
  ) {}

  private get useDb() {
    return isDatabaseEnabled() && !!this.repo;
  }

  async importProduct(buyerId: string, url: string): Promise<SocialPaymentRecord> {
    const product = await this.importEngine.importFromUrl(url);
    return this.saveImported(buyerId, product);
  }

  async getById(id: string, buyerId?: string): Promise<SocialPaymentRecord> {
    const record = await this.findRecord(id);
    if (!record) throw new NotFoundException('Pagamento não encontrado');
    if (buyerId && record.buyerId !== buyerId) throw new NotFoundException('Pagamento não encontrado');
    return record;
  }

  async listByBuyer(buyerId: string): Promise<SocialPaymentRecord[]> {
    if (this.useDb) {
      const rows = await this.repo!.find({
        where: { buyerId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      return rows.map((r) => this.toRecord(r));
    }
    return this.memoryRecords.filter((r) => r.buyerId === buyerId);
  }

  calculateCheckout(record: SocialPaymentRecord, dto: CheckoutSocialPaymentDto): SocialPaymentCheckout {
    const quantity = dto.quantity ?? record.quantity ?? 1;
    const deliveryKey = dto.deliveryOption ?? 'urigo';
    const deliveryFee = DELIVERY_FEES[deliveryKey] ?? DELIVERY_FEES.urigo;
    const productSubtotal = record.price * quantity;
    const serviceFee = Math.round(productSubtotal * SERVICE_FEE_RATE);
    const discount = dto.couponCode?.toUpperCase() === 'URIGO10'
      ? Math.round(productSubtotal * 0.1)
      : 0;
    const total = Math.max(0, productSubtotal + deliveryFee + serviceFee - discount);

    return {
      productSubtotal,
      quantity,
      deliveryFee,
      serviceFee,
      discount,
      total,
      currency: record.currency,
    };
  }

  async prepareCheckout(id: string, buyerId: string, dto: CheckoutSocialPaymentDto): Promise<SocialPaymentRecord> {
    const record = await this.getById(id, buyerId);
    const checkout = this.calculateCheckout(record, dto);

    const updated: Partial<SocialPaymentRecord> = {
      status: 'checkout',
      quantity: checkout.quantity,
      deliveryFee: checkout.deliveryFee,
      serviceFee: checkout.serviceFee,
      discount: checkout.discount,
      total: checkout.total,
      checkoutId: `CHK-${id.slice(0, 8).toUpperCase()}`,
    };

    return this.updateRecord(id, updated);
  }

  async pay(id: string, buyerId: string, dto: CheckoutSocialPaymentDto): Promise<SocialPaymentReceipt> {
    let record = await this.getById(id, buyerId);
    if (record.paymentStatus === 'paid') {
      throw new BadRequestException('Este produto já foi pago');
    }

    record = await this.prepareCheckout(id, buyerId, dto);
    const payWithWallet = dto.payWithWallet !== false;

    if (record.total <= 0 && record.price <= 0) {
      throw new BadRequestException('Preço do produto não identificado. Confirme o valor antes de pagar.');
    }

    const amount = record.total > 0 ? record.total : record.price * record.quantity;
    const txCode = `SP-${Date.now().toString(36).toUpperCase()}`;

    if (payWithWallet) {
      await this.walletService.pay(
        buyerId,
        amount,
        `UriPay Link — ${record.title.slice(0, 80)}`,
      );
    }

    const platformInfo = this.platformDetector.detect(record.originalUrl);

    const order = await this.ordersService.create({
      userId: buyerId,
      serviceType: 'pay',
      status: 'confirmed',
      items: [{
        menuItemId: record.id,
        name: record.title,
        quantity: record.quantity,
        price: record.price,
      }],
      total: amount,
      deliveryFee: record.deliveryFee,
      pickupLocation: {
        latitude: DEFAULT_ORIGIN.latitude,
        longitude: DEFAULT_ORIGIN.longitude,
        address: platformInfo.label,
      },
      deliveryLocation: {
        latitude: DEFAULT_ORIGIN.latitude,
        longitude: DEFAULT_ORIGIN.longitude,
        address: record.city ?? 'Entrega — comprador UriPay',
      },
    });

    const sync = this.syncService.evaluate(platformInfo, record.originalUrl);

    const paidRecord = await this.updateRecord(id, {
      status: 'paid',
      paymentStatus: 'paid',
      transactionId: txCode,
      orderId: order.id,
      total: amount,
      syncStatus: sync.syncStatus,
      syncMessage: sync.syncMessage,
    });

    const buyer = await this.usersService.findById(buyerId);
    const buyerName = buyer?.name ?? 'Comprador UriPay';

    void this.notificationsService.sendToUser(buyerId, {
      title: 'Pagamento confirmado',
      body: `"${record.title}" — ${amount.toLocaleString('pt-AO')} Kz. Recibo ${txCode}.`,
      data: { type: 'social_payment', paymentId: id, orderId: order.id },
    });

    if (record.sellerName) {
      const platformInfo = this.platformDetector.detect(record.originalUrl);
      const sellerMsg = this.syncService.buildSellerNotification({
        buyerName,
        productTitle: record.title,
        amount,
        transactionCode: txCode,
        originalUrl: record.originalUrl,
        platformLabel: platformInfo.label,
      });
      this.loggerSellerContact(sellerMsg, record);
    }

    return {
      payment: paidRecord,
      receiptCode: txCode,
      buyerName,
      paidAt: new Date().toISOString(),
    };
  }

  async markSynced(id: string, buyerId: string): Promise<SocialPaymentRecord> {
    const record = await this.getById(id, buyerId);
    const sync = this.syncService.markSynced(record.platform);
    return this.updateRecord(id, {
      syncStatus: sync.syncStatus,
      syncMessage: sync.syncMessage,
    });
  }

  private async saveImported(buyerId: string, product: ImportedSocialProduct): Promise<SocialPaymentRecord> {
    const data = {
      buyerId,
      platform: product.platform,
      originalUrl: product.originalUrl,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      category: product.category,
      condition: product.condition,
      brand: product.brand,
      city: product.city,
      country: product.country,
      images: product.images,
      videos: product.videos,
      sellerName: product.sellerName,
      status: 'imported' as const,
      paymentStatus: 'pending' as const,
      syncStatus: 'pending' as const,
      quantity: 1,
      deliveryFee: 0,
      serviceFee: 0,
      discount: 0,
      total: product.price,
      metadata: { completeness: product.completeness, aiEnriched: product.aiEnriched, platformLabel: product.platformLabel },
    };

    if (this.useDb) {
      const saved = await this.repo!.save(this.repo!.create(data));
      return this.toRecord(saved);
    }

    const record: SocialPaymentRecord = {
      id: `sp-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryRecords.unshift(record);
    return record;
  }

  private async findRecord(id: string): Promise<SocialPaymentRecord | undefined> {
    if (this.useDb) {
      const row = await this.repo!.findOne({ where: { id } });
      return row ? this.toRecord(row) : undefined;
    }
    return this.memoryRecords.find((r) => r.id === id);
  }

  private async updateRecord(id: string, patch: Partial<SocialPaymentRecord>): Promise<SocialPaymentRecord> {
    if (this.useDb) {
      const row = await this.repo!.findOne({ where: { id } });
      if (!row) throw new NotFoundException('Pagamento não encontrado');
      Object.assign(row, patch);
      const saved = await this.repo!.save(row);
      return this.toRecord(saved);
    }

    const idx = this.memoryRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException('Pagamento não encontrado');
    this.memoryRecords[idx] = {
      ...this.memoryRecords[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.memoryRecords[idx];
  }

  private toRecord(entity: SocialPaymentEntity): SocialPaymentRecord {
    const meta = entity.metadata as Record<string, unknown> | undefined;
    return {
      id: entity.id,
      buyerId: entity.buyerId,
      sellerId: entity.sellerId,
      platform: entity.platform,
      originalUrl: entity.originalUrl,
      title: entity.title,
      description: entity.description,
      price: Number(entity.price),
      currency: entity.currency,
      category: entity.category,
      condition: entity.condition,
      brand: entity.brand,
      city: entity.city,
      country: entity.country,
      images: entity.images ?? [],
      videos: entity.videos ?? [],
      sellerName: entity.sellerName,
      status: entity.status,
      paymentStatus: entity.paymentStatus,
      transactionId: entity.transactionId,
      checkoutId: entity.checkoutId,
      orderId: entity.orderId,
      syncStatus: entity.syncStatus,
      syncMessage: entity.syncMessage,
      quantity: entity.quantity,
      deliveryFee: Number(entity.deliveryFee),
      serviceFee: Number(entity.serviceFee),
      discount: Number(entity.discount),
      total: Number(entity.total),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      ...(meta?.platformLabel ? { platformLabel: String(meta.platformLabel) } : {}),
    } as SocialPaymentRecord & { platformLabel?: string };
  }

  private loggerSellerContact(
    msg: { title: string; body: string },
    record: SocialPaymentRecord,
  ) {
    // Sem credenciais de redes sociais — apenas registo para canal futuro / OAuth
    console.info(`[SocialPayment] Notificação vendedor (${record.sellerName}): ${msg.title} — ${record.originalUrl}`);
  }
}
