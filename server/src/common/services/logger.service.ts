import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

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
  private logDir = path.join(process.cwd(), 'logs');
  private isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: any, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  private writeToFile(level: LogLevel, message: string) {
    const fileName = `${level}-${new Date().toISOString().split('T')[0]}.log`;
    const filePath = path.join(this.logDir, fileName);
    
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(message: any, context?: LogContext) {
    const formattedMessage = this.formatMessage('log', message, context);
    
    if (this.isDevelopment) {
      console.log(formattedMessage);
    }
    
    this.writeToFile('log', formattedMessage);
  }

  error(message: any, trace?: string, context?: LogContext) {
    const errorContext = { ...context, trace };
    const formattedMessage = this.formatMessage('error', message, errorContext);
    
    console.error(formattedMessage);
    this.writeToFile('error', formattedMessage);
  }

  warn(message: any, context?: LogContext) {
    const formattedMessage = this.formatMessage('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(formattedMessage);
    }
    
    this.writeToFile('warn', formattedMessage);
  }

  debug(message: any, context?: LogContext) {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, context);
      console.debug(formattedMessage);
      this.writeToFile('debug', formattedMessage);
    }
  }

  verbose(message: any, context?: LogContext) {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('verbose', message, context);
      console.log(formattedMessage);
      this.writeToFile('verbose', formattedMessage);
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
