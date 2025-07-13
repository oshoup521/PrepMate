import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: 'Validation failed',
      errors: Object.keys(errors).length > 0 ? errors : exceptionResponse.message,
    });
  }
}
