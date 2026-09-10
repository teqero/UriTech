/**
 * Inicialização do Sentry — DEVE ser importada antes de qualquer outro módulo
 * (ver main.ts). Sem SENTRY_DSN definido, fica completamente inativo.
 */
import * as Sentry from '@sentry/node';

export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `uritech-backend@${process.env.npm_package_version || '1.0.0'}`,
    // Amostragem de performance: 100% em dev, 10% em prod (ajustar ao volume)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Não enviar dados pessoais por defeito (PII opt-in)
    sendDefaultPii: false,
    // Filtrar dados sensíveis dos breadcrumbs/requests
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  return true;
}

export { Sentry };
