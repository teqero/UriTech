import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Sentry } from '../../instrument';

/**
 * Filtro global de exceções com reporte ao Sentry.
 *
 * - Erros 5xx e erros não-HTTP (bugs, falhas de BD) → capturados no Sentry
 * - Erros 4xx (validação, auth) → NÃO reportados (são ruído operacional)
 *
 * Formata a resposta no formato padrão do NestJS para não alterar
 * o contrato da API.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      Sentry.captureException(exception, {
        extra: {
          path: request?.url,
          method: request?.method,
          requestId: request?.requestId,
        },
      });
      this.logger.error(
        `[${request?.method}] ${request?.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Resposta no formato padrão do NestJS
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body }
          : body,
      );
    } else {
      response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
      });
    }
  }
}
