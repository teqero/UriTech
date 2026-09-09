import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomInt } from 'crypto';
import { SmsService } from '../common/sms.service';
import { RedisService } from '../redis/redis.service';
import { UserEntity } from '../database/entities/user.entity';

/**
 * Verificação de número de telefone via SMS OTP.
 *
 * Segurança:
 *  - Código de 6 dígitos, só o hash SHA-256 é guardado (Redis, TTL 5 min)
 *  - Máx. 3 tentativas por código
 *  - Cooldown de 60s entre envios; máx. 5 envios por dia por utilizador
 *  - O código nunca aparece em logs em produção
 */
@Injectable()
export class PhoneVerificationService {
  private readonly logger = new Logger(PhoneVerificationService.name);
  private readonly OTP_TTL_SECONDS = 5 * 60; // 5 min
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS_PER_CODE = 3;
  private readonly MAX_SENDS_PER_DAY = 5;

  constructor(
    private readonly smsService: SmsService,
    private readonly redisService: RedisService,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async sendOtp(userId: string): Promise<{ expiresInSeconds: number }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');
    if (user.phoneVerified) {
      return { expiresInSeconds: 0 };
    }

    // Cooldown entre envios
    const cooldownKey = `phoneotp:cooldown:${userId}`;
    if (await this.redisService.exists(cooldownKey)) {
      throw new HttpException(
        `Aguarde ${this.RESEND_COOLDOWN_SECONDS}s antes de pedir um novo código.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Limite diário de envios
    const sendsKey = `phoneotp:sends:${userId}`;
    const sends = await this.redisService.increment(sendsKey, 24 * 60 * 60);
    if (sends > this.MAX_SENDS_PER_DAY) {
      throw new HttpException(
        'Limite diário de códigos SMS atingido. Tente novamente amanhã.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = this.hash(code);

    await this.redisService.storePhoneOtp(userId, codeHash, this.OTP_TTL_SECONDS);
    await this.redisService.setex(cooldownKey, this.RESEND_COOLDOWN_SECONDS, '1');

    await this.smsService.send({
      to: user.phone,
      text: `UriTech: o seu código de verificação é ${code}. Válido por 5 minutos. Não partilhe este código.`,
    });

    this.logger.log(`OTP enviado para ${user.phone} (user=${userId})`);
    return { expiresInSeconds: this.OTP_TTL_SECONDS };
  }

  async verifyOtp(userId: string, code: string): Promise<{ verified: boolean }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');
    if (user.phoneVerified) return { verified: true };

    const storedHash = await this.redisService.getPhoneOtp(userId);
    if (!storedHash) {
      throw new BadRequestException('Código expirado ou inexistente. Peça um novo código.');
    }

    // Limite de tentativas por código
    const attemptsKey = `phoneotp:attempts:${userId}`;
    const attempts = await this.redisService.increment(attemptsKey, this.OTP_TTL_SECONDS);
    if (attempts > this.MAX_ATTEMPTS_PER_CODE) {
      await this.redisService.deletePhoneOtp(userId);
      throw new HttpException(
        'Demasiadas tentativas. Peça um novo código.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (storedHash !== this.hash(code)) {
      throw new BadRequestException('Código incorreto.');
    }

    // Sucesso: consumir código e marcar telefone como verificado
    await this.redisService.deletePhoneOtp(userId);
    user.phoneVerified = true;
    await this.usersRepo.save(user);

    this.logger.log(`Telefone verificado: user=${userId}`);
    return { verified: true };
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
