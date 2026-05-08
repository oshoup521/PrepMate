import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
  }

  private formatMessage(level: string, message: any, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
  }

  log(message: any, context?: LogContext) {
    console.log(this.formatMessage('log', message, context));
  }

  error(message: any, trace?: string, context?: LogContext) {
    const ctx = trace ? { ...context, stack: trace } : context;
    console.error(this.formatMessage('error', message, ctx));
  }

  warn(message: any, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: any, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  verbose(message: any, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('verbose', message, context));
    }
  }

  // Custom methods for specific logging scenarios
  logUserAction(action: string, userId: string, details?: any, req?: any) {
    const context: LogContext = {
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    };
    
    this.log(`User action: ${action}`, context);
  }

  logAPICall(method: string, url: string, statusCode: number, responseTime: number, req?: any) {
    const context: LogContext = {
      method,
      url,
      statusCode,
      responseTime,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      userId: req?.user?.id,
    };
    
    this.log(`API Call: ${method} ${url} - ${statusCode} (${responseTime}ms)`, context);
  }

  logSecurity(event: string, details: any, req?: any) {
    const context: LogContext = {
      securityEvent: event,
      details: JSON.stringify(details),
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      timestamp: new Date().toISOString(),
    };
    
    this.warn(`Security Event: ${event}`, context);
  }

  logPerformance(operation: string, duration: number, context?: LogContext) {
    const perfContext: LogContext = {
      ...context,
      operation,
      duration,
      performanceLog: true,
    };
    
    this.log(`Performance: ${operation} took ${duration}ms`, perfContext);
  }
}
