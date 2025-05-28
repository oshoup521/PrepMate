import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        
        // If Redis URL is provided, use Redis, otherwise use in-memory cache
        if (redisUrl) {
          return {
            store: await redisStore({
              url: redisUrl,
            }),
            ttl: 300000, // 5 minutes default TTL
            max: 1000, // Maximum number of items in cache
          };
        } else {
          // Fallback to in-memory cache for development
          return {
            ttl: 300000, // 5 minutes default TTL
            max: 1000, // Maximum number of items in cache
          };
        }
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CustomCacheModule {}