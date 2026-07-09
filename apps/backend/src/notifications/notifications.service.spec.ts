import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
    service.onModuleInit();
  });

  it('regista token Expo por utilizador', () => {
    const result = service.registerToken('2', 'ExponentPushToken[abc]', 'ios');
    expect(result.ok).toBe(true);
    expect(result.tokenCount).toBe(1);
  });

  it('sendToUser devolve 0 sem dispositivos', async () => {
    const result = await service.sendToUser('unknown-user', {
      title: 'Teste',
      body: 'Mensagem',
    });
    expect(result.sent).toBe(0);
  });

  it('regista subscrição web push', () => {
    const result = service.registerWebPush('2', {
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'key', auth: 'auth' },
    });
    expect(result.ok).toBe(true);
    expect(result.subscriptionCount).toBe(1);
  });

  it('expõe chave VAPID pública do ambiente', () => {
    process.env.VAPID_PUBLIC_KEY = 'demo-vapid-public-key';
    const config = service.getWebPushPublicKey();
    expect(config.publicKey).toBe('demo-vapid-public-key');
    delete process.env.VAPID_PUBLIC_KEY;
  });
});
