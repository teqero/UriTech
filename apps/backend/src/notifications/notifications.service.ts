import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Order, Ride, RideStatus, OrderStatus } from '@uritech/shared';
import webpush from 'web-push';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface DeviceRecord {
  userId: string;
  token: string;
  platform: string;
  updatedAt: string;
}

interface WebPushRecord {
  userId: string;
  endpoint: string;
  subscription: webpush.PushSubscription;
  updatedAt: string;
}

export type { DeviceRecord };

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly tokensByUser = new Map<string, Set<string>>();
  private readonly webPushByUser = new Map<string, Map<string, WebPushRecord>>();
  private readonly deviceRecords: DeviceRecord[] = [];
  private vapidConfigured = false;

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@uritech.com';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.vapidConfigured = true;
        this.logger.log('Web Push VAPID configurado');
      } catch (err) {
        this.logger.warn(
          `VAPID inválido: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  getWebPushPublicKey() {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
      enabled: this.vapidConfigured,
    };
  }

  registerToken(userId: string, token: string, platform = 'unknown') {
    let tokens = this.tokensByUser.get(userId);
    if (!tokens) {
      tokens = new Set();
      this.tokensByUser.set(userId, tokens);
    }
    tokens.add(token);

    const existing = this.deviceRecords.find((d) => d.userId === userId && d.token === token);
    if (existing) {
      existing.updatedAt = new Date().toISOString();
      existing.platform = platform;
    } else {
      this.deviceRecords.push({
        userId,
        token,
        platform,
        updatedAt: new Date().toISOString(),
      });
    }

    this.logger.log(`Push token registado: user=${userId} platform=${platform}`);
    return { ok: true, tokenCount: tokens.size };
  }

  registerWebPush(
    userId: string,
    subscription: webpush.PushSubscription,
  ) {
    let userSubs = this.webPushByUser.get(userId);
    if (!userSubs) {
      userSubs = new Map();
      this.webPushByUser.set(userId, userSubs);
    }

    userSubs.set(subscription.endpoint, {
      userId,
      endpoint: subscription.endpoint,
      subscription,
      updatedAt: new Date().toISOString(),
    });

    this.logger.log(`Web push registado: user=${userId}`);
    return { ok: true, subscriptionCount: userSubs.size };
  }

  async sendToUser(userId: string, message: PushMessage) {
    const expoResult = await this.sendExpoToUser(userId, message);
    const webResult = await this.sendWebPushToUser(userId, message);
    return { sent: (expoResult.sent ?? 0) + (webResult.sent ?? 0) };
  }

  private async sendExpoToUser(userId: string, message: PushMessage) {
    const tokens = this.tokensByUser.get(userId);
    if (!tokens?.size) {
      return { sent: 0 };
    }

    const payloads = [...tokens].map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default' as const,
    }));

    return this.sendExpoPush(payloads);
  }

  private async sendWebPushToUser(userId: string, message: PushMessage) {
    if (!this.vapidConfigured) return { sent: 0 };

    const subs = this.webPushByUser.get(userId);
    if (!subs?.size) return { sent: 0 };

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      data: message.data,
      url: message.data?.type === 'ride'
        ? `/tracking?ref=${message.data.rideId}`
        : message.data?.type === 'order'
          ? `/tracking?service=lojas&ref=${message.data.orderId}`
          : '/notificacoes',
    });

    let sent = 0;
    for (const record of subs.values()) {
      try {
        await webpush.sendNotification(record.subscription, payload);
        sent += 1;
      } catch (err) {
        this.logger.warn(
          `Web push falhou (${record.endpoint.slice(0, 32)}…): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        subs.delete(record.endpoint);
      }
    }

    if (sent > 0) this.logger.log(`Web push enviado: ${sent} para user=${userId}`);
    return { sent };
  }

  async notifyRideUpdate(ride: Ride) {
    const messages: Partial<Record<RideStatus, PushMessage>> = {
      driver_found: {
        title: 'Motorista encontrado',
        body: `O seu motorista foi atribuído para ${ride.destination.address ?? 'o destino'}.`,
        data: { type: 'ride', rideId: ride.id, status: ride.status },
      },
      driver_arriving: {
        title: 'Motorista a caminho',
        body: 'O motorista está a chegar ao ponto de recolha.',
        data: { type: 'ride', rideId: ride.id, status: ride.status },
      },
      in_progress: {
        title: 'Corrida em curso',
        body: 'A sua viagem começou. Boa viagem!',
        data: { type: 'ride', rideId: ride.id, status: ride.status },
      },
      completed: {
        title: 'Corrida concluída',
        body: `Viagem terminada. Total: ${ride.fare.toLocaleString('pt-AO')} Kz.`,
        data: { type: 'ride', rideId: ride.id, status: ride.status },
      },
    };

    const message = messages[ride.status];
    if (!message) return { sent: 0 };
    return this.sendToUser(ride.userId, message);
  }

  async notifyOrderUpdate(order: Order, extraRecipients: string[] = []) {
    const userMessages: Partial<Record<OrderStatus, PushMessage>> = {
      confirmed: {
        title: 'Pedido confirmado',
        body: 'A loja confirmou o seu pedido.',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
      preparing: {
        title: 'Pedido em preparação',
        body: 'A loja está a preparar a sua encomenda.',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
      ready: {
        title: 'Pedido pronto',
        body: 'A encomenda está pronta para recolha pelo entregador.',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
      picked_up: {
        title: 'Pedido recolhido',
        body: 'O entregador recolheu o seu pedido.',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
      in_transit: {
        title: 'Pedido a caminho',
        body: 'O entregador está a caminho da sua morada.',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
      delivered: {
        title: 'Pedido entregue',
        body: 'A sua encomenda foi entregue. Obrigado!',
        data: { type: 'order', orderId: order.id, status: order.status },
      },
    };

    const vendorMessage: PushMessage = {
      title: 'Novo pedido na loja',
      body: `Pedido #${order.id.slice(0, 8)} — ${order.total.toLocaleString('pt-AO')} Kz`,
      data: { type: 'order', orderId: order.id, status: order.status },
    };

    const results: { sent?: number }[] = [];
    if (order.status === 'pending' && order.vendorId) {
      results.push(await this.sendToUser(order.vendorId, vendorMessage));
    }

    const userMessage = userMessages[order.status];
    if (userMessage) {
      results.push(await this.sendToUser(order.userId, userMessage));
    }

    for (const recipientId of extraRecipients) {
      if (userMessage) {
        results.push(await this.sendToUser(recipientId, userMessage));
      }
    }

    return { sent: results.reduce((sum, r) => sum + (r.sent ?? 0), 0) };
  }

  listDevices(userId?: string) {
    if (userId) return this.deviceRecords.filter((d) => d.userId === userId);
    return this.deviceRecords;
  }

  private async sendExpoPush(
    messages: {
      to: string;
      title: string;
      body: string;
      data?: Record<string, string>;
      sound?: 'default';
    }[],
  ) {
    if (messages.length === 0) return { sent: 0 };

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`Expo push falhou: ${res.status} ${text}`);
        return { sent: 0, error: text };
      }

      this.logger.log(`Expo push enviado: ${messages.length} mensagem(ns)`);
      return { sent: messages.length };
    } catch (err) {
      this.logger.warn(`Expo push erro: ${err instanceof Error ? err.message : String(err)}`);
      return { sent: 0 };
    }
  }
}
