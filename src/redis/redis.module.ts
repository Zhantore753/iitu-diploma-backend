// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global() // Делаем глобальным, чтобы использовать во всем приложении
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const commonOptions = {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        };

        // Prefer a single connection string (REDIS_URL) when provided —
        // managed hosts like Railway expose Redis this way. Fall back to
        // discrete host/port for local docker-compose.
        const redisUrl = configService.get<string>('REDIS_URL');
        const redis = redisUrl
          ? new Redis(redisUrl, commonOptions)
          : new Redis({
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD'),
              db: configService.get<number>('REDIS_DB', 0),
              ...commonOptions,
            });

        // Обработчики событий
        redis.on('connect', () => {
          console.log('✅ Redis connected successfully');
        });

        redis.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
        });

        redis.on('close', () => {
          console.log('🔌 Redis connection closed');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}