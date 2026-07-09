import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { OrdersService } from './orders.service';
import type { OrderStatus } from '@uritech/shared';
import { StoreCheckoutDto } from './dto/store-checkout.dto';
import { NotificationsService } from '../notifications/notifications.service';

const VENDOR_ROLES = new Set(['vendor', 'restaurant', 'pharmacy', 'supermarket', 'store']);

const RIDER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('available') available?: string,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    if (user?.role === 'delivery_rider' && available === 'true') {
      return this.ordersService.findAvailableForDelivery();
    }
    if (user && VENDOR_ROLES.has(user.role)) {
      return this.ordersService.findByVendor(vendorId ?? user.userId);
    }
    if (user?.role === 'user') {
      return this.ordersService.findByUser(user.userId);
    }
    if (user?.role === 'delivery_rider') {
      return this.ordersService.findByRider(user.userId);
    }
    if (user?.role === 'admin') {
      return this.ordersService.findAll();
    }
    return this.ordersService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post('checkout')
  async checkout(@Body() body: StoreCheckoutDto, @CurrentUser() user: JwtUserPayload) {
    if (user.role !== 'user') {
      throw new ForbiddenException('Apenas clientes podem fazer checkout de loja');
    }
    const order = await this.ordersService.checkoutStore(user.userId, body);
    void this.notificationsService.notifyOrderUpdate(order);
    return order;
  }

  @Post()
  create(@Body() body: Parameters<OrdersService['create']>[0], @CurrentUser() user: JwtUserPayload) {
    return this.ordersService.create({ ...body, userId: body.userId ?? user.userId });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: JwtUserPayload,
  ) {
    const order = await this.ordersService.findById(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (VENDOR_ROLES.has(user.role)) {
      if (order.vendorId !== user.userId) {
        throw new ForbiddenException('Pedido de outra loja');
      }
      const updated = await this.ordersService.updateStatus(id, status);
      if (updated) void this.notificationsService.notifyOrderUpdate(updated);
      return updated;
    }

    if (user.role === 'delivery_rider') {
      if (status === 'picked_up' && order.status === 'ready' && !order.driverId) {
        const updated = await this.ordersService.updateStatus(id, status, user.userId);
        if (updated) void this.notificationsService.notifyOrderUpdate(updated);
        return updated;
      }
      if (order.driverId === user.userId) {
        const allowed = RIDER_NEXT[order.status];
        if (allowed && status === allowed) {
          const updated = await this.ordersService.updateStatus(id, status, user.userId);
          if (updated) void this.notificationsService.notifyOrderUpdate(updated);
          return updated;
        }
      }
      throw new ForbiddenException('Não autorizado a actualizar este pedido');
    }

    if (user.role === 'admin') {
      const updated = await this.ordersService.updateStatus(id, status);
      if (updated) void this.notificationsService.notifyOrderUpdate(updated);
      return updated;
    }

    throw new ForbiddenException('Não autorizado');
  }
}
