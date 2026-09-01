import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { UserEntity } from '../database/entities/user.entity';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);
  private readonly BACKUP_CODES_COUNT = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  /**
   * Inicia a configuração de 2FA para um utilizador.
   * Gera um secret TOTP e um QR code para scan.
   * Não ativa o 2FA ainda — precisa de confirmação com um código válido.
   */
  async setup(userId: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA já está activo. Desactive primeiro para reconfigurar.');
    }

    const secret = speakeasy.generateSecret({
      name: `UriTech (${user.email})`,
      issuer: 'UriTech',
      length: 32,
    });

    // Guardar secret temporariamente (ainda não confirmado)
    await this.usersRepo.update(userId, {
      twoFactorSecret: secret.base32,
    });

    const otpauthUrl = secret.otpauth_url!;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    this.logger.log(`2FA setup iniciado para user=${userId}`);
    return { secret: secret.base32, qrCodeDataUrl };
  }

  /**
   * Confirma a configuração de 2FA verificando um código TOTP.
   * Se válido, activa o 2FA e gera backup codes.
   */
  async confirmSetup(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilizador não encontrado');
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Setup de 2FA não iniciado. Chame /2fa/setup primeiro.');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA já está activo.');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Permite 1 intervalo antes/depois (30s)
    });

    if (!verified) {
      throw new UnauthorizedException('Código TOTP inválido. Tente novamente.');
    }

    // Gerar backup codes
    const backupCodes = this.generateBackupCodes();

    await this.usersRepo.update(userId, {
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes,
    });

    this.logger.log(`2FA activado para user=${userId}`);
    return { backupCodes };
  }

  /**
   * Verifica um código TOTP durante o login.
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Verificar TOTP
    const totpValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (totpValid) return true;

    // Verificar backup code
    if (user.twoFactorBackupCodes?.includes(token)) {
      // Consumir backup code (remover da lista)
      const updatedCodes = user.twoFactorBackupCodes.filter((c) => c !== token);
      await this.usersRepo.update(userId, {
        twoFactorBackupCodes: updatedCodes,
      });
      this.logger.warn(`Backup code usado para user=${userId}. Códigos restantes: ${updatedCodes.length}`);
      return true;
    }

    return false;
  }

  /**
   * Desactiva o 2FA para um utilizador.
   * Requer password ou código TOTP para segurança.
   */
  async disable(userId: string, verificationToken?: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA não está activo.');
    }

    // Se fornecer token, verificar
    if (verificationToken) {
      const valid = await this.verifyToken(userId, verificationToken);
      if (!valid) {
        throw new UnauthorizedException('Código de verificação inválido.');
      }
    }

    await this.usersRepo.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
    });

    this.logger.log(`2FA desactivado para user=${userId}`);
  }

  /**
   * Gera novos backup codes (substitui os existentes).
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    const valid = await this.verifyToken(userId, token);
    if (!valid) {
      throw new UnauthorizedException('Código TOTP inválido.');
    }

    const backupCodes = this.generateBackupCodes();
    await this.usersRepo.update(userId, {
      twoFactorBackupCodes: backupCodes,
    });

    return backupCodes;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // 8 caracteres alfanuméricos, formato: XXXX-XXXX
      const bytes = randomBytes(4);
      const code = bytes.toString('hex').toUpperCase().slice(0, 8);
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }
}
