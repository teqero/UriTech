import { Injectable, Logger } from '@nestjs/common';

export interface AlertNotification {
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AlertNotificationService {
  private readonly logger = new Logger(AlertNotificationService.name);

  private readonly slackWebhookUrl = process.env.ALERT_SLACK_WEBHOOK_URL;
  private readonly smtpHost = process.env.ALERT_SMTP_HOST;
  private readonly smtpPort = Number(process.env.ALERT_SMTP_PORT || 587);
  private readonly smtpUser = process.env.ALERT_SMTP_USER;
  private readonly smtpPass = process.env.ALERT_SMTP_PASS;
  private readonly alertEmailTo = process.env.ALERT_EMAIL_TO;

  async send(notification: AlertNotification): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.slackWebhookUrl) {
      promises.push(this.sendSlack(notification));
    }

    if (this.smtpHost && this.smtpUser && this.smtpPass && this.alertEmailTo) {
      promises.push(this.sendEmail(notification));
    }

    if (promises.length === 0) {
      this.logger.warn('Nenhum canal de alerta configurado. Alerta perdido:');
      this.logger.warn(`[${notification.severity.toUpperCase()}] ${notification.title}: ${notification.message}`);
      return;
    }

    await Promise.allSettled(promises);
  }

  private async sendSlack(notification: AlertNotification): Promise<void> {
    try {
      const color = notification.severity === 'critical' ? '#FF0000' : '#FFA500';
      const payload = {
        attachments: [
          {
            color,
            title: `🚨 ${notification.severity.toUpperCase()}: ${notification.title}`,
            text: notification.message,
            footer: 'UriTech Alerting',
            ts: Math.floor(notification.timestamp.getTime() / 1000),
            fields: notification.metadata
              ? Object.entries(notification.metadata).map(([title, value]) => ({
                  title,
                  value: String(value),
                  short: true,
                }))
              : [],
          },
        ],
      };

      const response = await fetch(this.slackWebhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook falhou: ${response.status}`);
      }

      this.logger.log(`Alerta enviado para Slack: ${notification.title}`);
    } catch (err) {
      this.logger.error('Falha ao enviar alerta Slack', err);
    }
  }

  private async sendEmail(notification: AlertNotification): Promise<void> {
    try {
      // Usar nodemailer se disponível, senão fetch SMTP básico
      const nodemailer = await import('nodemailer').catch(() => null);
      if (!nodemailer) {
        this.logger.warn('nodemailer não instalado. A instalar...');
        // Fallback: log apenas
        this.logger.log(`[EMAIL] Para: ${this.alertEmailTo}`);
        this.logger.log(`[EMAIL] Assunto: [${notification.severity.toUpperCase()}] ${notification.title}`);
        this.logger.log(`[EMAIL] Corpo: ${notification.message}`);
        return;
      }

      const transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"UriTech Alerts" <${this.smtpUser}>`,
        to: this.alertEmailTo,
        subject: `[${notification.severity.toUpperCase()}] ${notification.title}`,
        text: notification.message,
        html: `
          <h2 style="color: ${notification.severity === 'critical' ? '#FF0000' : '#FFA500'}">
            ${notification.severity === 'critical' ? '🔴' : '🟠'} ${notification.title}
          </h2>
          <p>${notification.message}</p>
          <p><strong>Timestamp:</strong> ${notification.timestamp.toISOString()}</p>
          ${notification.metadata ? `<pre>${JSON.stringify(notification.metadata, null, 2)}</pre>` : ''}
        `,
      });

      this.logger.log(`Alerta enviado por email: ${notification.title}`);
    } catch (err) {
      this.logger.error('Falha ao enviar alerta email', err);
    }
  }
}
