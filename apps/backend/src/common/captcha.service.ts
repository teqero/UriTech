import { Injectable, Logger } from '@nestjs/common';

/**
 * Verificação CAPTCHA — suporta Cloudflare Turnstile e Google reCAPTCHA v2/v3.
 *
 * Configuração:
 *  - CAPTCHA_PROVIDER=turnstile + TURNSTILE_SECRET_KEY
 *  - CAPTCHA_PROVIDER=recaptcha + RECAPTCHA_SECRET_KEY
 *  - Sem provider: verificação desativada (dev) — o fluxo de login
 *    continua a exigir o campo mas aceita qualquer valor não-vazio.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  get isEnabled(): boolean {
    return Boolean(process.env.CAPTCHA_PROVIDER);
  }

  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (!this.isEnabled) {
      return Boolean(token); // dev: basta enviar qualquer token
    }
    if (!token) return false;

    const provider = process.env.CAPTCHA_PROVIDER;
    try {
      if (provider === 'turnstile') {
        return await this.verifyTurnstile(token, remoteIp);
      }
      if (provider === 'recaptcha') {
        return await this.verifyRecaptcha(token, remoteIp);
      }
      this.logger.warn(`CAPTCHA_PROVIDER desconhecido: ${provider}`);
      return false;
    } catch (err) {
      this.logger.error(`Falha na verificação CAPTCHA: ${err instanceof Error ? err.message : err}`);
      return false; // fail-closed em produção
    }
  }

  private async verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: remoteIp,
      }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  }

  private async verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY ?? '',
      response: token,
    });
    if (remoteIp) params.set('remoteip', remoteIp);

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = (await res.json()) as { success: boolean; score?: number };
    // v3: exigir score razoável; v2: só success
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  }
}
