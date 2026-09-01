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
import { DEFAULT_ORIGIN } from '@uritech/shared';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreateRideDto } from './dto/create-ride.dto';
import { RidesService } from './rides.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { RideStatus } from '@uritech/shared';

@ApiTags('Rides')
@ApiBearerAuth('JWT-auth')
@Controller('rides')
export class RidesController {
  constructor(
    private ridesService: RidesService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar corridas' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de corridas' })
  findAll(
    @Query('status') status?: RideStatus,
    @Query('userId') userId?: string,
    @Query('driverId') driverId?: string,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    if (status) return this.ridesService.findByStatus(status);
    if (userId) return this.ridesService.findByUser(userId);
    if (driverId) return this.ridesService.findByDriver(driverId);
    if (user?.role === 'user') return this.ridesService.findByUser(user.userId);
    if (user?.role === 'driver') return this.ridesService.findByDriver(user.userId);
    return this.ridesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da corrida' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Corrida não encontrada' })
  findOne(@Param('id') id: string) {
    return this.ridesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar corrida', description: 'Cria nova corrida e debita saldo se necessário' })
  @ApiBody({ type: CreateRideDto })
  @ApiResponse({ status: 201, description: 'Corrida criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() body: CreateRideDto, @CurrentUser() user: JwtUserPayload) {
    const destination = body.destination.address
      ? body.destination
      : { ...body.destination, address: body.destination.address ?? 'Destino' };

    if (body.fare > 0) {
      await this.walletService.pay(
        user.userId,
        body.fare,
        `Corrida taxi — ${destination.address ?? 'Destino'}`,
      );
    }

    const ride = await this.ridesService.create({
      userId: user.userId,
      status: 'searching',
      mode: body.mode,
      pickup: body.pickup.latitude ? body.pickup : DEFAULT_ORIGIN,
      destination,
      fare: body.fare,
      distance: body.distance ?? 5000,
      duration: body.duration ?? 900,
      vehicleType: body.vehicleType,
    });

    void this.notificationsService.sendToUser(user.userId, {
      title: 'Corrida solicitada',
      body: 'Estamos a procurar um motorista disponível.',
      data: { type: 'ride', rideId: ride.id, status: ride.status },
    });

    return ride;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado', description: 'Driver aceita/inicia/termina; User cancela' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Corrida não encontrada' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: RideStatus,
    @CurrentUser() user: JwtUserPayload,
  ) {
    const ride = await this.ridesService.findById(id);
    if (!ride) throw new NotFoundException('Corrida não encontrada');

    if (user.role === 'driver') {
      if (status === 'driver_found' && ride.status === 'searching') {
        const updated = await this.ridesService.updateStatus(id, status, user.userId);
        if (updated) void this.notificationsService.notifyRideUpdate(updated);
        return updated;
      }
      if (ride.driverId === user.userId) {
        const updated = await this.ridesService.updateStatus(id, status, user.userId);
        if (updated) void this.notificationsService.notifyRideUpdate(updated);
        return updated;
      }
      throw new ForbiddenException('Não autorizado a actualizar esta corrida');
    }

    if (user.role === 'user' && ride.userId === user.userId) {
      if (status === 'cancelled') {
        const updated = await this.ridesService.updateStatus(id, status);
        if (updated) {
          void this.notificationsService.sendToUser(updated.userId, {
            title: 'Corrida cancelada',
            body: 'A sua reserva foi cancelada.',
            data: { type: 'ride', rideId: updated.id, status: updated.status },
          });
        }
        return updated;
      }
    }

    throw new ForbiddenException('Não autorizado');
  }
}
