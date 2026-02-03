import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserType } from 'generated/prisma';
import ms from 'ms';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getTokens(userId: number, email: string, roles: UserType[]) {
  const userRoles = roles || [UserType.admin]; // или ваше значение по умолчанию


    // Добавляем значения по умолчанию через оператор ||
    const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
    const JWT_SECRET_EXP = this.configService.get<string>('JWT_SECRET_EXP') || '15m'; 

    const JWT_REFRESH_SECRET = this.configService.get<string>('JWT_REFRESH_SECRET');
    const JWT_REFRESH_SECRET_EXP = this.configService.get<string>('JWT_REFRESH_SECRET_EXP') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, roles },
        {
          secret: JWT_SECRET,
          expiresIn: JWT_SECRET_EXP as any, // Приводим к any, чтобы TS не ругался на StringValue
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, roles },
        {
          secret: JWT_REFRESH_SECRET,
          expiresIn: JWT_REFRESH_SECRET_EXP as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}