import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import type { Ride } from '@uritech/shared';
import type { RideUpdatePayload, DriverLocationPayload } from './rides-events.service';

interface SocketUserData {
  userId: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/rides',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RidesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ??
      (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(`Socket ${client.id} conectou sem token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as {
        sub: string;
        email: string;
        role: string;
        type?: string;
      };

      if (payload.type === 'refresh') {
        throw new Error('Refresh token não permitido');
      }

      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      } as SocketUserData;

      this.logger.debug(
        `Socket ${client.id} autenticado — user ${payload.sub} (${payload.role})`,
      );
    } catch (err) {
      this.logger.warn(`Socket ${client.id} token inválido: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} desconectado`);
  }

  @SubscribeMessage('subscribeRide')
  handleSubscribeRide(client: Socket, rideId: string): void {
    if (!rideId || typeof rideId !== 'string') {
      client.emit('error', { message: 'rideId inválido' });
      return;
    }
    client.join(`ride:${rideId}`);
    client.emit('subscribed', { rideId });
    this.logger.debug(`Socket ${client.id} subscreveu ride ${rideId}`);
  }

  @SubscribeMessage('unsubscribeRide')
  handleUnsubscribeRide(client: Socket, rideId: string): void {
    client.leave(`ride:${rideId}`);
    client.emit('unsubscribed', { rideId });
  }

  @SubscribeMessage('driverLocation')
  handleDriverLocation(client: Socket, payload: DriverLocationPayload): void {
    const user = client.data.user as SocketUserData | undefined;
    if (!user || user.role !== 'driver') {
      client.emit('error', { message: 'Apenas motoristas podem enviar localização' });
      return;
    }

    if (
      !payload?.rideId ||
      typeof payload.lat !== 'number' ||
      typeof payload.lng !== 'number'
    ) {
      client.emit('error', { message: 'Payload de localização inválido' });
      return;
    }

    // Broadcast para todos na room da corrida (exceto o emissor)
    client.to(`ride:${payload.rideId}`).emit('driverLocation', {
      ...payload,
      driverId: user.userId,
      timestamp: Date.now(),
    });
  }

  @OnEvent('ride.update')
  handleRideUpdateEvent(payload: RideUpdatePayload): void {
    this.server.to(`ride:${payload.rideId}`).emit('rideUpdate', payload);
    this.logger.debug(`Evento ride.update broadcast para ride:${payload.rideId}`);
  }

  @OnEvent('ride.driverLocation')
  handleDriverLocationEvent(payload: DriverLocationPayload): void {
    this.server
      .to(`ride:${payload.rideId}`)
      .emit('driverLocation', { ...payload, timestamp: Date.now() });
  }
}
