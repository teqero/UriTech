/**
 * bcryptjs via esm.sh (pure JS — sem Workers; compatível com Supabase Edge).
 * NestJS usa o mesmo algoritmo (bcrypt / bcryptjs).
 */
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3?target=deno&no-check';

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPasswordHash(plain: string, hash: string): boolean {
  try {
    return Boolean(bcrypt.compareSync(plain, hash));
  } catch {
    return false;
  }
}

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}
