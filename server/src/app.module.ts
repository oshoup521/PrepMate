import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { CustomCacheModule } from './cache/cache.module';

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
    ]),    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'prepmate.sqlite',
      entities: [User, InterviewSession],
      synchronize: true, // Don't use in production
    }),
    CustomCacheModule,
    InterviewModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecurityMiddleware, CustomLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*'); // Apply security middleware to all routes
  }
}
