import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../common/email.service';
import { RedisService } from '../redis/redis.service';
import { UserEntity } from '../database/entities/user.entity';

/**
 * Recuperação de conta (reset de password).
 *
 * Fluxo seguro:
 *  1. requestReset: gera token aleatório (32 bytes), guarda APENAS o hash
 *     SHA-256 em Redis com TTL de 15 min, envia o token por email.
 *  2. confirmReset: valida o token (single-use), aplica a password policy
 *     (via DTO), atualiza o hash bcrypt e revoga TODOS os refresh tokens.
 *
 * Nunca revela se o email existe (anti-enumeration).
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_TTL_SECONDS = 15 * 60; // 15 min

  constructor(
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async requestReset(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      // Não revelar se o email existe (anti-enumeration)
      this.logger.log(`Reset solicitado para email inexistente: ${email}`);
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.redisService.storePasswordResetToken(tokenHash, user.id, this.TOKEN_TTL_SECONDS);

    const resetUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Recuperação de palavra-passe — UriTech',
      text: `Olá ${user.name},\n\nRecebemos um pedido para redefinir a sua palavra-passe.\n\nClique no link (válido por 15 minutos):\n${resetUrl}\n\nSe não fez este pedido, ignore este email — a sua conta permanece segura.`,
      html: this.buildResetEmailHtml(user.name, resetUrl),
    });

    this.logger.log(`Email de reset enviado para ${user.email}`);
  }

  async confirmReset(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const userId = await this.redisService.getPasswordResetUserId(tokenHash);

    if (!userId) {
      throw new BadRequestException('Token inválido ou expirado. Solicite um novo reset.');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Token inválido ou expirado. Solicite um novo reset.');
    }

    // Single-use: consumir o token imediatamente
    await this.redisService.deletePasswordResetToken(tokenHash);

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.save(user);

    // Revogar todas as sessões — o atacante pode estar logado
    await this.redisService.revokeAllUserRefreshTokens(user.id);

    this.logger.log(`Password redefinida com sucesso: user=${user.id}`);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildResetEmailHtml(name: string, url: string): string {
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
    .warning { background: #FEF3C7; border-radius: 8px; padding: 12px; font-size: 13px; color: #92400E; }
    .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">UriTech</div>
    <h1>Olá, ${name}!</h1>
    <p>Recebemos um pedido para redefinir a palavra-passe da sua conta.</p>
    <a href="${url}" class="button">Redefinir Palavra-passe</a>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #4F46E5;">${url}</p>
    <div class="warning">
      ⚠️ Este link é válido por apenas <strong>15 minutos</strong> e só pode ser usado uma vez.
    </div>
    <div class="footer">
      Se não fez este pedido, ignore este email — a sua conta permanece segura.<br>
      UriTech — Tecnologia para Angola
    </div>
  </div>
</body>
</html>`;
  }
}
