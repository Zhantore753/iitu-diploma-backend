import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheableMemory, Keyv } from 'cacheable';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { CatchEverythingFilter } from './filters/catch-everything/catch-everything.filter';
import { LoggingInterceptor } from './logging/logging.interceptor';
import { MachineModule } from './machine/machine.module';
import { PrismaModule } from './prisma/prisma.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { TokensModule } from './tokens/tokens.module';
import { TransformInterceptor } from './transform/transform.interceptor';
import { UsersModule } from './users/users.module';
import { CacheConfigModule } from './cache/cache-config/cache-config.module';
import { RentalModule } from './rental/rental.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheConfigModule,
    AuthModule,
    UsersModule,
    PrismaModule,
    BcryptModule,
    TokensModule,
    RefreshTokenModule,
    MachineModule,
    CacheConfigModule,
    RentalModule,
    AnalyticsModule,
    AdminModule,
    OtpModule,
    RedisModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
