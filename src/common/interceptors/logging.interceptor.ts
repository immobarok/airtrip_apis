import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') ?? 'unknown';
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    (request as any).correlationId = correlationId;
    response.setHeader('X-Correlation-Id', correlationId);

    const startTime = Date.now();

    this.logger.log(
      `[${correlationId}] → ${method} ${originalUrl} | ${className}.${handlerName} | IP: ${ip} | UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          const contentLength = response.get('content-length') ?? '-';

          this.logger.log(
            `[${correlationId}] ← ${method} ${originalUrl} ${statusCode} | ${duration}ms | ${contentLength}B`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            `[${correlationId}] ✗ ${method} ${originalUrl} | ${duration}ms | ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
