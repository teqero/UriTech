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

@Controller('rides')
export class RidesController {
  constructor(
    private ridesService: RidesService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) {}

  @Public()
  @Get()
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
  findOne(@Param('id') id: string) {
    return this.ridesService.findById(id);
  }

  @Post()
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
