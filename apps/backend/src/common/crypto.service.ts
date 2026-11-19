import { Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { ValueTransformer } from 'typeorm';

const logger = new Logger('Encryption');

/**
 * Criptografia em repouso (AES-256-GCM) para dados sensíveis.
 *
 * Chave: variável ENCRYPTION_KEY (64 chars hex = 32 bytes, ou qualquer string
 * que é derivada via SHA-256). Formato guardado: `enc:v1:<iv>:<tag>:<dados>`
 * em base64 — distinguível de plaintext para migração gradual.
 *
 * Sem ENCRYPTION_KEY:
 *  - dev: guarda plaintext (aviso no arranque)
 *  - produção: ERRO fatal (não arranca sem chave)
 */

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY obrigatória em produção (dados sensíveis não podem ficar em plaintext)');
    }
    return null;
  }
  // Aceita hex de 64 chars ou qualquer string (derivada)
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw).digest();
}

let warned = false;
function warnOnce() {
  if (!warned) {
    logger.warn('ENCRYPTION_KEY não definida — dados sensíveis guardados em PLAINTEXT (apenas dev)');
    warned = true;
  }
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const key = getKey();
  if (!key) {
    warnOnce();
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptField(stored: string | null | undefined): string | null {
  if (stored === null || stored === undefined || stored === '') return null;
  if (!stored.startsWith('enc:v1:')) return stored; // plaintext legado
  const key = getKey();
  if (!key) {
    throw new Error('Campo encriptado encontrado mas ENCRYPTION_KEY não está definida');
  }
  const parts = stored.split(':');
  const iv = Buffer.from(parts[2], 'base64');
  const tag = Buffer.from(parts[3], 'base64');
  const data = Buffer.from(parts[4], 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Transformer TypeORM — usar em @Column({ transformer: encryptedColumn }) */
export const encryptedColumn: ValueTransformer = {
  to: (value: string | null | undefined) => encryptField(value),
  from: (value: string | null | undefined) => decryptField(value),
};
