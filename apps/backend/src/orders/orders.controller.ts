import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
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
import { ServiceCheckoutDto } from './dto/service-checkout.dto';
import { NotificationsService } from '../notifications/notifications.service';

const VENDOR_ROLES = new Set(['vendor', 'restaurant', 'pharmacy', 'supermarket', 'store']);

const RIDER_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  picked_up: 'in_transit',
  in_transit: 'delivered',
};

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos', description: 'Devolve pedidos filtrados por papel do utilizador' })
  @ApiQuery({ name: 'vendorId', required: false, description: 'Filtrar por loja (admin/vendor)' })
  @ApiQuery({ name: 'available', required: false, description: 'Pedidos disponíveis para entrega (delivery_rider)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
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
  @ApiOperation({ summary: 'Detalhes do pedido' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Detalhes do pedido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post('service-checkout')
  @ApiOperation({ summary: 'Checkout de serviço', description: 'Solicita um serviço on-demand (taxi, entrega, etc.)' })
  @ApiBody({ type: ServiceCheckoutDto })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  @ApiResponse({ status: 403, description: 'Apenas clientes podem solicitar' })
  async serviceCheckout(@Body() body: ServiceCheckoutDto, @CurrentUser() user: JwtUserPayload) {
    if (user.role !== 'user') {
      throw new ForbiddenException('Apenas clientes podem solicitar serviços');
    }
    const order = await this.ordersService.checkoutService(user.userId, body);
    void this.notificationsService.notifyOrderUpdate(order);
    return order;
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout de loja', description: 'Faz pedido numa loja/restaurante' })
  @ApiBody({ type: StoreCheckoutDto })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  @ApiResponse({ status: 403, description: 'Apenas clientes podem fazer checkout' })
  async checkout(@Body() body: StoreCheckoutDto, @CurrentUser() user: JwtUserPayload) {
    if (user.role !== 'user') {
      throw new ForbiddenException('Apenas clientes podem fazer checkout de loja');
    }
    const order = await this.ordersService.checkoutStore(user.userId, body);
    void this.notificationsService.notifyOrderUpdate(order);
    return order;
  }

  @Post()
  @ApiOperation({ summary: 'Criar pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  create(@Body() body: Parameters<OrdersService['create']>[0], @CurrentUser() user: JwtUserPayload) {
    return this.ordersService.create({ ...body, userId: body.userId ?? user.userId });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado', description: 'Actualiza estado do pedido (vendor, rider, admin)' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
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
