import { Platform } from 'react-native';
import { APP_BUILD_CHANNEL, APP_VERSION } from '@uritech/shared';

type SentryDsn = { publicKey: string; host: string; projectId: string };

function parseDsn(dsn: string): SentryDsn | null {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\//, '');
    if (!publicKey || !projectId || !u.host) return null;
    return { publicKey, host: u.host, projectId };
  } catch {
    return null;
  }
}

function getDsn(): SentryDsn | null {
  const raw = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!raw) return null;
  return parseDsn(raw);
}

export function isSentryEnabled(): boolean {
  return getDsn() !== null;
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

/** Envia excepção ao Sentry (HTTP store). Sem DSN → no-op. */
export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const dsn = getDsn();
  if (!dsn) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = newEventId();
  const url = `https://${dsn.host}/api/${dsn.projectId}/store/`;

  const payload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: Platform.OS === 'web' ? 'javascript' : 'javascript',
    level: 'error',
    server_name: 'urigo-mobile',
    release: `urigo-mobile@${APP_VERSION}`,
    environment: APP_BUILD_CHANNEL,
    tags: {
      platform: Platform.OS,
      ...(context?.source ? { source: String(context.source) } : {}),
    },
    extra: context ?? {},
    exception: {
      values: [
        {
          type: err.name || 'Error',
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split('\n')
                  .slice(1, 30)
                  .map((line) => ({ filename: line.trim(), function: line.trim() })),
              }
            : undefined,
        },
      ],
    },
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_client=urigo-mobile/${APP_VERSION},sentry_key=${dsn.publicKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Nunca bloquear UX
  }
}
