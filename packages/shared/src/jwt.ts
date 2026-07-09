import { jwtVerify, type JWTPayload } from 'jose';

export interface UriGoJwtPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  vendorSubtype?: string;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'uritech-secret-key';
}

export async function verifyAuthJwt(
  token: string,
  secret = getJwtSecret(),
): Promise<UriGoJwtPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    if (!payload.sub || !payload.role) return null;
    return payload as UriGoJwtPayload;
  } catch {
    return null;
  }
}
