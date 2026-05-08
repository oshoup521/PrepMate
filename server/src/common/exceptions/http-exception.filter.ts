import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../services/logger.service';
import { ErrorLogService } from '../../error-log/error-log.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: CustomLoggerService,
    @Optional() private readonly errorLogService?: ErrorLogService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || exception.message;
        error = (errorResponse as any).error || 'Http Exception';
      } else {
        message = errorResponse as string;
        error = 'Http Exception';
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    const userId = (request as any).user?.id;
    const logCtx = { method: request.method, path: request.url, status, ip: request.ip, userId };
    const stack = exception instanceof Error ? exception.stack : undefined;
    const rawMessage = exception instanceof Error ? exception.message : message;

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} - ${status} - ${rawMessage}`, stack, logCtx);
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`, logCtx);
    }

    // Persist to DB — only 4xx+ (skip routine 401/403 noise, keep everything >= 400 that's a real bug)
    if (status >= 400 && this.errorLogService) {
      this.errorLogService.save({
        level: status >= 500 ? 'error' : 'warn',
        method: request.method,
        path: request.url,
        statusCode: status,
        message: rawMessage,
        stack: status >= 500 ? stack : undefined,
        userId,
        ip: request.ip,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    });
  }
}
