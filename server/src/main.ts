import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { AllExceptionsFilter as HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomLoggerService } from './common/services/logger.service';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const customLogger = app.get(CustomLoggerService);

  // Security headers
  app.use(helmet());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(customLogger));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  // Global exception filters (order matters - most specific first)
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('PrepMate API')
    .setDescription('AI-Powered Interview Coach API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('interview', 'Interview session endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth'
    )
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://your-production-domain.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'PrepMate API Documentation',
  });

  // Get CORS origin from environment or use multiple origins
  const corsOrigin = configService.get('CORS_ORIGIN');
  const origins = corsOrigin ? 
    [corsOrigin, 'http://localhost:5173', 'http://localhost:5174'] : 
    [
      'https://prepmate-ucro.onrender.com', 
      'http://localhost:5173',
      'http://localhost:5174',
      'https://prepmate.oshoupadhyay.in',
      'https://prep-mate-chi.vercel.app',
      'http://localhost:3000',
      'https://crack-leading-feline.ngrok-free.app',
    ];
    
  // Enable CORS for the frontend - allowing all origins in development mode
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' 
      ? true // Allow all origins in development mode
      : origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation available at: http://localhost:${port}/api`);
}
bootstrap();
