import { Injectable, Logger } from '@nestjs/common';

export interface SmsMessage {
  to: string; // número com código de país, ex: +244923456789
  text: string;
}

/**
 * Envio de SMS. Suporta:
 *  - Twilio (SMS_PROVIDER=twilio + TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM)
 *  - Webhook genérico (SMS_PROVIDER=webhook + SMS_WEBHOOK_URL, ex: gateway local EMIS/Unitel)
 *  - Sem configuração → loga em vez de enviar (dev)
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;

  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'none';
    if (this.provider === 'none') {
      this.logger.warn(
        'SMS não configurado. Mensagens serão logadas em vez de enviadas. ' +
          'Defina SMS_PROVIDER=twilio|webhook e as credenciais correspondentes.',
      );
    } else {
      this.logger.log(`SMS provider configurado: ${this.provider}`);
    }
  }

  async send(message: SmsMessage): Promise<void> {
    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(message);
      case 'webhook':
        return this.sendViaWebhook(message);
      default:
        this.logger.log(`[SMS SIMULADO] Para: ${message.to} — "${message.text}"`);
    }
  }

  private async sendViaTwilio(message: SmsMessage): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) {
      throw new Error('Twilio incompleto: defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({ To: message.to, From: from, Body: message.text });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const detail = await res.text();
      this.logger.error(`Twilio falhou (${res.status}): ${detail.slice(0, 200)}`);
      throw new Error(`Falha ao enviar SMS via Twilio: ${res.status}`);
    }
    this.logger.log(`SMS enviado via Twilio para ${message.to}`);
  }

  private async sendViaWebhook(message: SmsMessage): Promise<void> {
    const url = process.env.SMS_WEBHOOK_URL;
    if (!url) throw new Error('SMS_WEBHOOK_URL não definido');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: message.to, text: message.text }),
    });

    if (!res.ok) {
      this.logger.error(`SMS webhook falhou (${res.status})`);
      throw new Error(`Falha ao enviar SMS via webhook: ${res.status}`);
    }
    this.logger.log(`SMS enviado via webhook para ${message.to}`);
  }
}
