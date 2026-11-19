import { APP_BUILD_CHANNEL, APP_CLIENT_NAME, APP_VERSION } from '@uritech/shared';
import { Platform } from 'react-native';
import { getApiBaseUrl } from './api';

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

let sessionRequestId = newRequestId();

export function getClientRequestId(): string {
  return sessionRequestId;
}

export function rotateClientRequestId(): string {
  sessionRequestId = newRequestId();
  return sessionRequestId;
}

export function clientTelemetryHeaders(): Record<string, string> {
  return {
    'X-Request-Id': getClientRequestId(),
    'X-UriGo-Client': `${APP_CLIENT_NAME}/${APP_VERSION}`,
    'X-UriGo-Channel': APP_BUILD_CHANNEL,
  };
}

export async function reportClientError(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const base = getApiBaseUrl().replace(/\/$/, '');

  try {
    await fetch(`${base}/telemetry/client-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientTelemetryHeaders(),
        'X-No-Retry': '1',
      },
      body: JSON.stringify({
        message,
        stack,
        platform: Platform.OS,
        ...context,
      }),
    });
  } catch {
    // Telemetria não deve bloquear a UX
  }
}