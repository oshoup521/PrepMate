import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { CustomLoggerService } from '../services/logger.service';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Format validation errors
    const errors = {};
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      exceptionResponse.message.forEach((error: string) => {
        const [field, ...messageParts] = error.split(' ');
        const fieldName = field.replace(/^\w+\./, ''); // Remove DTO prefix
        if (!errors[fieldName]) {
          errors[fieldName] = [];
        }
        errors[fieldName].push(messageParts.join(' '));
      });
    }

    const formattedErrors = Object.keys(errors).length > 0 ? errors : exceptionResponse.message;

    this.logger.warn(
      `Validation failed: ${request.method} ${request.url}`,
      { path: request.url, method: request.method, errors: JSON.stringify(formattedErrors), ip: request.ip },
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
}
