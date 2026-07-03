import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standard error response shape returned by all exception filters.
 */
export interface ErrorResponseBody {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  correlationId?: string;
}

/**
 * HttpExceptionFilter – Catches all `HttpException` instances and returns
 * a consistent, client-safe JSON envelope.
 *
 * This filter normalises the various shapes a NestJS `HttpException` response
 * can take (string, object, array of validation messages) into a single
 * predictable format that matches the project's `ApiErrorResponse` contract.
 *
 * Register globally in `main.ts`:
 * ```ts
 * app.useGlobalFilters(new HttpExceptionFilter());
 * ```
 *
 * Or via the DI container in `AppModule`:
 * ```ts
 * { provide: APP_FILTER, useClass: HttpExceptionFilter }
 * ```
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const correlationId = (request as any).correlationId as
      | string
      | undefined;

    const isProduction = process.env.NODE_ENV === 'production';

    // Normalise the message and handle validation errors
    let message: string;
    let errors: any[] | undefined = undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || exception.message;
    } else {
      message = exception.message;
    }

    const body: any = {
      success: false,
      statusCode,
      message: Array.isArray((exceptionResponse as any).message) 
        ? (exceptionResponse as any).message 
        : message,
      error: exception.name.replace('Exception', '').replace(/([A-Z])/g, ' $1').trim(),
    };

    if (!isProduction) {
      body.path = request.originalUrl;
      body.timestamp = new Date().toISOString();
      if (correlationId) {
        body.correlationId = correlationId;
      }
    }

    this.logger.warn(
      `[${correlationId ?? 'N/A'}] ${request.method} ${request.originalUrl} → ${statusCode} ${message}`,
    );

    response.status(statusCode).json(body);
  }
}
