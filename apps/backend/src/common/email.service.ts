import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email transport configurado: ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP não configurado. Emails serão logados em vez de enviados. ' +
        'Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.',
      );
    }
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[EMAIL SIMULADO] Para: ${message.to}`);
      this.logger.log(`[EMAIL SIMULADO] Assunto: ${message.subject}`);
      this.logger.log(`[EMAIL SIMULADO] Texto: ${message.text.slice(0, 200)}...`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"UriTech" <${process.env.SMTP_USER}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      this.logger.log(`Email enviado para ${message.to}: ${message.subject}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar email para ${message.to}`, err);
      throw err;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}
