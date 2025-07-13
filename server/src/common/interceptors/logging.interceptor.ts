import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const startTime = Date.now();

    // Log the incoming request
    this.logger.log(`Incoming Request: ${method} ${url}`, {
      method,
      url,
      body: this.sanitizeBody(body),
      query,
      params,
      ip: request.ip,
      userAgent: request.headers?.['user-agent'],
      userId: request.user?.id,
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - startTime;
          const httpResponse = context.switchToHttp().getResponse();
          
          this.logger.logAPICall(
            method,
            url,
            httpResponse.statusCode,
            responseTime,
            request
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const httpResponse = context.switchToHttp().getResponse();
          
          this.logger.error(`Request failed: ${method} ${url}`, error.stack, {
            method,
            url,
            statusCode: httpResponse.statusCode || 500,
            responseTime,
            errorMessage: error.message,
            ip: request.ip,
            userId: request.user?.id,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'token', 'authorization', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
