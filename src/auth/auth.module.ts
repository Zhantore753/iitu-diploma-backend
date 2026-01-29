import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { BcryptModule } from 'src/bcrypt/bcrypt.module';
import { RefreshTokenModule } from 'src/refresh-token/refresh-token.module';
import { TokensModule } from 'src/tokens/tokens.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { RolesGuard } from './guards/roles.guard';
import { OtpModule } from 'src/otp/otp.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [
    FileModule,
    UsersModule,
    BcryptModule,
    RefreshTokenModule,
    TokensModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
    Logger
  ],
  exports: [UsersModule],
})
export class AuthModule {}
