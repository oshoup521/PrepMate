import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InterviewModule } from './interview/interview.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { InterviewSession } from './interview/entities/interview-session.entity';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { CustomLoggerService } from './common/services/logger.service';
import { EmailService } from './common/services/email.service';
import { CustomCacheModule } from './cache/cache.module';
import { PaymentModule } from './payment/payment.module';
import { SubscriptionCheckInterceptor } from './common/interceptors/subscription-check.interceptor';

function parseDbUrl(rawUrl: string) {
  // Strip protocol
  const withoutProtocol = rawUrl.replace(/^(?:postgresql|postgres):\/\//, '');
  // Use last @ to split credentials from host (handles @ in password)
  const lastAt = withoutProtocol.lastIndexOf('@');
  const credentials = withoutProtocol.substring(0, lastAt);
  const hostPart = withoutProtocol.substring(lastAt + 1);
  // Split username:password
  const colonIdx = credentials.indexOf(':');
  const username = credentials.substring(0, colonIdx);
  const password = credentials.substring(colonIdx + 1); // raw, no decoding
  // Split host:port/database
  const slashIdx = hostPart.indexOf('/');
  const hostPort = hostPart.substring(0, slashIdx);
  const database = hostPart.substring(slashIdx + 1);
  const [host, portStr] = hostPort.split(':');
  return { host, port: parseInt(portStr, 10) || 5432, username, password, database };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres' as const,
            ...parseDbUrl(process.env.DATABASE_URL),
            entities: [User, InterviewSession],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          }
        : {
            type: 'sqlite' as const,
            database: 'prepmate.sqlite',
            entities: [User, InterviewSession],
            synchronize: true,
          },
    ),
    CustomCacheModule,
    InterviewModule,
    UsersModule,
    AuthModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SecurityMiddleware,
    CustomLoggerService,
    EmailService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SubscriptionCheckInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*'); // Apply security middleware to all routes
  }
}
