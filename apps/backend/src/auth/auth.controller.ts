import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    private twoFactorAuthService: TwoFactorAuthService,
  ) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login', description: 'Autentica com email + password. Se 2FA activo, devolve partialToken.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Autenticação bem-sucedida ou requer 2FA', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou conta bloqueada' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('login/2fa')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verificar 2FA', description: 'Completa login com código TOTP ou backup code.' })
  @ApiResponse({ status: 201, description: 'Autenticação completa' })
  @ApiResponse({ status: 401, description: 'Código inválido ou sessão expirada' })
  verifyTwoFactor(@Body() body: { partialToken: string; code: string }) {
    return this.authService.verifyTwoFactor(body.partialToken, body.code);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Registo', description: 'Cria nova conta de utilizador e envia email de verificação' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registo bem-sucedido — verifique o email' })
  @ApiResponse({ status: 409, description: 'Email ou telefone já existe' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh Token', description: 'Troca refresh token por novo par de tokens (rotação)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 201, description: 'Novo par de tokens', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout', description: 'Invalida access token (blacklist) e refresh token' })
  @ApiResponse({ status: 201, description: 'Logout bem-sucedido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido' })
  logout(
    @Headers('authorization') authHeader: string,
    @Body() body: { refreshToken?: string },
  ) {
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Token de acesso não fornecido');
    return this.authService.logout(token, body?.refreshToken);
  }

  // ── Email Verification ──

  @Public()
  @Get('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verificar Email', description: 'Confirma email via token enviado por email' })
  @ApiQuery({ name: 'token', description: 'Token de verificação de email' })
  @ApiResponse({ status: 200, description: 'Email verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async verifyEmail(@Query('token') token: string) {
    const result = await this.emailVerificationService.verifyEmail(token);
    return {
      success: true,
      message: 'Email verificado com sucesso! Pode agora fazer login.',
      email: result.email,
    };
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Reenviar Email de Verificação', description: 'Solicita novo email de verificação' })
  @ApiResponse({ status: 201, description: 'Email reenviado (se conta existir e não verificada)' })
  async resendVerification(@Body() body: { email: string }) {
    await this.emailVerificationService.resendVerificationEmail(body.email);
    return {
      success: true,
      message: 'Se a conta existir e o email não estiver verificado, um novo email foi enviado.',
    };
  }

  // ── Two-Factor Authentication ──

  @Post('2fa/setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Setup 2FA', description: 'Inicia configuração de 2FA. Devolve secret e QR code.' })
  @ApiResponse({ status: 201, description: 'QR code e secret gerados' })
  async setup2fa(@CurrentUser('sub') userId: string) {
    const result = await this.twoFactorAuthService.setup(userId);
    return {
      success: true,
      secret: result.secret,
      qrCode: result.qrCodeDataUrl,
      message: 'Escaneie o QR code com Google Authenticator ou Authy e introduza o código para confirmar.',
    };
  }

  @Post('2fa/confirm')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirmar Setup 2FA', description: 'Activa 2FA após verificar código TOTP.' })
  @ApiResponse({ status: 201, description: '2FA activado com backup codes' })
  @ApiResponse({ status: 401, description: 'Código TOTP inválido' })
  async confirm2fa(
    @CurrentUser('sub') userId: string,
    @Body() body: { token: string },
  ) {
    const result = await this.twoFactorAuthService.confirmSetup(userId, body.token);
    return {
      success: true,
      backupCodes: result.backupCodes,
      message: '2FA activado! Guarde os backup codes num local seguro.',
    };
  }

  @Post('2fa/disable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desactivar 2FA', description: 'Remove 2FA da conta.' })
  @ApiResponse({ status: 201, description: '2FA desactivado' })
  async disable2fa(
    @CurrentUser('sub') userId: string,
    @Body() body: { verificationToken?: string },
  ) {
    await this.twoFactorAuthService.disable(userId, body.verificationToken);
    return {
      success: true,
      message: '2FA desactivado.',
    };
  }

  @Post('2fa/backup-codes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Regenerar Backup Codes', description: 'Gera novos backup codes.' })
  @ApiResponse({ status: 201, description: 'Novos backup codes gerados' })
  async regenerateBackupCodes(
    @CurrentUser('sub') userId: string,
    @Body() body: { token: string },
  ) {
    const codes = await this.twoFactorAuthService.regenerateBackupCodes(userId, body.token);
    return {
      success: true,
      backupCodes: codes,
      message: 'Novos backup codes gerados. Guarde-os num local seguro.',
    };
  }
}
