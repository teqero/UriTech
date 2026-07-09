import { SignJWT } from 'jose';
import { getJwtSecret, verifyAuthJwt } from '@uritech/shared';

describe('verifyAuthJwt', () => {
  const secret = 'test-secret-key';

  it('valida token assinado correctamente', async () => {
    const token = await new SignJWT({ email: 'joao@uritech.com', role: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setIssuedAt()
      .sign(new TextEncoder().encode(secret));

    const payload = await verifyAuthJwt(token, secret);
    expect(payload?.sub).toBe('user-1');
    expect(payload?.role).toBe('user');
  });

  it('rejeita token inválido', async () => {
    const payload = await verifyAuthJwt('invalid.token.here', secret);
    expect(payload).toBeNull();
  });

  it('usa JWT_SECRET por omissão', () => {
    expect(getJwtSecret()).toBeTruthy();
  });
});
