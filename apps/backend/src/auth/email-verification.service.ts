import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { EmailService } from '../common/email.service';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async sendVerificationEmail(user: UserEntity): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    user.emailVerificationToken = token;
    user.emailVerificationExpiresAt = expiresAt;
    await this.usersRepo.save(user);

    const verificationUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Verifique o seu email — UriTech',
      text: `Olá ${user.name},\n\nPor favor verifique o seu email clicando no link:\n${verificationUrl}\n\nEste link expira em ${this.TOKEN_EXPIRY_HOURS} horas.\n\nSe não solicitou este registo, ignore este email.`,
      html: this.buildVerificationEmailHtml(user.name, verificationUrl),
    });

    this.logger.log(`Email de verificação enviado para ${user.email}`);
  }

  async verifyEmail(token: string): Promise<{ verified: boolean; email: string }> {
    const user = await this.usersRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Token de verificação inválido');
    }

    if (user.emailVerified) {
      return { verified: true, email: user.email };
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('Token de verificação expirado. Solicite um novo.');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await this.usersRepo.save(user);

    this.logger.log(`Email verificado: ${user.email}`);
    return { verified: true, email: user.email };
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      // Não revelar se email existe ou não (security)
      this.logger.log(`Resend solicitado para email inexistente: ${email}`);
      return;
    }

    if (user.emailVerified) {
      return;
    }

    await this.sendVerificationEmail(user);
  }

  private buildVerificationEmailHtml(name: string, url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #4F46E5; }
    h1 { font-size: 20px; margin-bottom: 16px; color: #111; }
    p { color: #444; line-height: 1.6; margin-bottom: 16px; }
    .button { display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">UriTech</div>
    <h1>Olá, ${name}!</h1>
    <p>Obrigado por se registar na UriTech. Para completar o seu registo, por favor confirme o seu email clicando no botão abaixo:</p>
    <a href="${url}" class="button">Verificar Email</a>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #4F46E5;">${url}</p>
    <p>Este link expira em 24 horas.</p>
    <div class="footer">
      Se não solicitou este registo, pode ignorar este email.<br>
      UriTech — Tecnologia para Angola
    </div>
  </div>
</body>
</html>`;
  }
}
