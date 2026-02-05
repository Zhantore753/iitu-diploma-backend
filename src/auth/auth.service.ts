import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as ms from 'ms';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { OtpService } from 'src/otp/otp.service';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { TokensService } from 'src/tokens/tokens.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import {
  CompleteRegistrationDto,
  RegisterInitDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { FileService } from 'src/file/file.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService, // Сервис для отправки OTP
    private readonly fileService: FileService, // ✅ ВОТ ОНО
    private readonly logger: Logger,
  ) {}

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    // Проверяем существует ли пользователь
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Для безопасности не сообщаем, что пользователя не существует
      return;
    }

    // Генерируем токен сброса пароля
    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        purpose: 'password_reset',
      },
      {
        secret: this.configService.get('JWT_RESET_SECRET'),
        expiresIn: '1h', // Токен действует 1 час
      },
    );

    // Сохраняем хеш токена в Redis для проверки использования
    const hashedToken = await this.bcryptService.hash(resetToken);
    await this.otpService.storePasswordResetToken(user.email, hashedToken);

    // TODO: Отправляем email с токеном
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;

    this.logger.log(`Password reset URL for ${user.email}: ${resetUrl}`);
    // В продакшене:
    // await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      // Проверяем JWT токен
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });

      if (payload.purpose !== 'password_reset') {
        return false;
      }

      // Проверяем, что токен не был использован
      const storedHash = await this.otpService.getPasswordResetToken(
        payload.email,
      );
      if (!storedHash) {
        return false;
      }

      // Сравниваем хеш токена
      const isValid = await this.bcryptService.compare(token, storedHash);
      return isValid;
    } catch (error) {
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Проверяем токен
    const isValid = await this.verifyResetToken(token);
    if (!isValid) {
      throw new BadRequestException(
        'Неверный или просроченный токен сброса пароля',
      );
    }

    // Декодируем токен для получения email
    const payload = (await this.jwtService.decode(token)) as any;

    // Находим пользователя
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Валидация пароля (опционально)
    this.validatePassword(newPassword);

    // Обновляем пароль через usersService
    await this.usersService.updatePassword(user.id, newPassword);

    // Удаляем использованный токен
    await this.otpService.clearPasswordResetToken(payload.email);

    // Разлогиниваем все сессии пользователя
    await this.refreshTokenService.deleteAllByUser(user.id);

    // TODO: Отправить email подтверждения смены пароля
    this.logger.log(`Password reset successful for user: ${user.email}`);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isValid = await this.bcryptService.compare(
      currentPassword,
      user.password,
    );
    if (!isValid) {
      throw new BadRequestException('Текущий пароль неверен');
    }

    // Валидация нового пароля
    this.validatePassword(newPassword);

    // Проверяем, что новый пароль отличается от старого
    const isSamePassword = await this.bcryptService.compare(
      newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от старого',
      );
    }

    // Обновляем пароль
    await this.usersService.updatePassword(userId, newPassword);

    // Разлогиниваем все сессии (опционально, но рекомендуется)
    await this.refreshTokenService.deleteAllByUser(userId);

    // TODO: Отправить email уведомление
    this.logger.log(`Password changed for user: ${user.email}`);
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Пароль должен содержать минимум 8 символов',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать хотя бы одну заглавную букву',
      );
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать хотя бы одну строчную букву',
      );
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать хотя бы одну цифру',
      );
    }

    // Проверка на распространенные слабые пароли
    const weakPasswords = [
      'password',
      '12345678',
      'qwerty',
      'admin123',
      'password123',
      'letmein',
      'welcome',
      'monkey',
      'sunshine',
      'iloveyou',
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      throw new BadRequestException('Пароль слишком простой, выберите другой');
    }
  }

  async getResetTokenInfo(
    token: string,
  ): Promise<{ email: string; expiresAt: Date } | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });

      if (payload.purpose !== 'password_reset') {
        return null;
      }

      // Получаем время истечения
      const expiresAt = new Date(payload.exp * 1000);

      return {
        email: payload.email,
        expiresAt,
      };
    } catch (error) {
      return null;
    }
  }

  async signUp(
    createUserDto: CreateUserDto,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<any> {
    const userExists = await this.usersService.findByEmail(createUserDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashPassword = await this.bcryptService.hash(createUserDto.password);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashPassword,
    });
    const { accessToken, refreshToken } = await this.tokensService.getTokens(
      newUser.id,
      newUser.email,
      [newUser.userType],
    );

    const refreshExpStr = this.configService.get<string>(
      'JWT_REFRESH_SECRET_EXP',
    ) as ms.StringValue;
    const expMs = ms(refreshExpStr);
    const expiresAt = new Date(Date.now() + expMs);

    await this.refreshTokenService.create(
      refreshToken,
      newUser.id,
      expiresAt,
      meta,
    );

    const maxSessions = Number(
      this.configService.get<number>('REFRESH_TOKEN_MAX_SESSIONS') ?? 5,
    );

    await this.refreshTokenService.enforceMaxSessions(newUser.id, maxSessions);
    return { accessToken, refreshToken, newUser };
  }

  // Этап 1: Начало регистрации (проверка email и отправка OTP)
  async registerInit(
    registerDto: RegisterInitDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    // Проверяем, существует ли пользователь
    const userExists = await this.usersService.findByEmail(registerDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    // Генерируем и отправляем OTP
    const otp = await this.otpService.generateAndSendOtp(registerDto.email);

    // Временно сохраняем данные регистрации (можно использовать Redis или временное хранилище)
    await this.otpService.storeRegistrationData(registerDto.email, {
      email: registerDto.email,
      passwordHash: registerDto.password,
      firstName: registerDto.firstName,
      meta,
    });

    return {
      message: 'OTP sent to email',
      email: registerDto.email,
      otpExpiry: otp.expiry, // Для отладки, в продакшене не отправлять
    };
  }

  // Этап 2: Подтверждение почты OTP
  async verifyEmail(verifyDto: VerifyEmailDto) {
    // Проверяем OTP
    const isValid = await this.otpService.verifyOtp(
      verifyDto.email,
      verifyDto.otp,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Получаем временные данные регистрации
    const registrationData = await this.otpService.getRegistrationData(
      verifyDto.email,
    );
    if (!registrationData) {
      throw new BadRequestException(
        'Registration session expired. Please start over.',
      );
    }

    // Отмечаем email как подтвержденный
    await this.otpService.markEmailAsVerified(verifyDto.email);

    // Генерируем временный токен для завершения регистрации
    const tempToken = await this.jwtService.signAsync(
      { email: verifyDto.email, stage: 'email_verified' },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    return {
      message: 'Email verified successfully',
      tempToken,
      nextStep: 'complete-registration',
    };
  }

  // Этап 3: Завершение регистрации
  async completeRegistration(
    completeDto: CompleteRegistrationDto,
    avatar: Express.Multer.File,
    meta?: { ip?: string; userAgent?: string },
  ) {
    if (!avatar) {
      throw new BadRequestException('Avatar is required');
    }
    // Проверяем временный токен (можно также валидировать через Guard)
    try {
      const decoded = await this.jwtService.verifyAsync(completeDto.tempToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (
        decoded.email !== completeDto.email ||
        decoded.stage !== 'email_verified'
      ) {
        throw new BadRequestException('Invalid registration session');
      }
    } catch (err) {
      throw new BadRequestException('Registration session expired');
    }

    // Проверяем, что email все еще не занят
    const userExists = await this.usersService.findByEmail(completeDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const avatarUrl = await this.fileService.upload(avatar, 'avatars');

    // Получаем хеш пароля из временного хранилища
    const registrationData = await this.otpService.getRegistrationData(
      completeDto.email,
    );

    if (!registrationData) {
      throw new BadRequestException('Registration data not found');
    }

    const newUser = await this.usersService.create({
      email: completeDto.email,
      password: registrationData.passwordHash,
      firstName: registrationData.firstName,
      lastName: completeDto.nickname,
      phone: completeDto.phone,
      bio: completeDto.bio,
      avatar: avatarUrl,
      userType: completeDto.userType,
      isVerified: true,
    });

    // Генерируем токены
    const { accessToken, refreshToken } = await this.tokensService.getTokens(
      newUser.id,
      newUser.email,
      [newUser.userType],
    );

    // Сохраняем refresh token
    const refreshExpStr = this.configService.get<string>(
      'JWT_REFRESH_SECRET_EXP',
    ) as ms.StringValue;
    const expMs = ms(refreshExpStr);
    const expiresAt = new Date(Date.now() + expMs);

    await this.refreshTokenService.create(
      refreshToken,
      newUser.id,
      expiresAt,
      meta || registrationData.meta,
    );

    // Ограничиваем количество сессий
    const maxSessions = Number(
      this.configService.get<number>('REFRESH_TOKEN_MAX_SESSIONS') ?? 5,
    );
    await this.refreshTokenService.enforceMaxSessions(newUser.id, maxSessions);

    // Очищаем временные данные
    await this.otpService.clearRegistrationData(completeDto.email);

    return { accessToken, refreshToken, user: newUser };
  }

  // SignIn: создаём access + refresh, сохраняем refresh (хеш) и возвращаем access + refresh (или помещаем в cookie)
  async signIn(
    email: string,
    password: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid (email) credentials');

    const isValid = await this.bcryptService.compare(password, user.password);
    if (!isValid)
      throw new UnauthorizedException('Invalid (password) credentials');

    const { accessToken, refreshToken } = await this.tokensService.getTokens(
      user.id,
      user.email,
      [user.userType],
    );

    // compute expiresAt for refresh token
    const expiresAt = this.getRefreshTokenExpiry();

    // create hashed refresh token record
    await this.refreshTokenService.create(
      refreshToken,
      user.id,
      expiresAt,
      meta,
    );

    // enforce max sessions if configured
    const maxSessions = Number(
      this.configService.get<number>('REFRESH_TOKEN_MAX_SESSIONS') ?? 5,
    );
    await this.refreshTokenService.enforceMaxSessions(user.id, maxSessions);

    return { accessToken, refreshToken, user };
  }

  private getRefreshTokenExpiry(): Date {
    const refreshExpStr = this.configService.get<string>(
      'JWT_REFRESH_SECRET_EXP',
    );
    const expMs = ms(refreshExpStr as ms.StringValue);
    return new Date(Date.now() + expMs);
  }

  async refresh(
    user: { sub: number; refreshToken: string },
    clientMeta?: { ip?: string; userAgent?: string },
  ) {
    const { sub, refreshToken } = user;
    const matched = await this.refreshTokenService.findMatchingToken(
      sub,
      refreshToken,
    );

    if (!matched) {
      // reuse detection: token signature valid but not found in DB -> revoke all sessions for safety
      await this.refreshTokenService.deleteAllByUser(sub);
      throw new UnauthorizedException(
        'Refresh token reuse detected or token revoked',
      );
    }

    // matched -> check expiry
    if (matched.expiresAt.getTime() < Date.now()) {
      // delete expired token
      await this.refreshTokenService.deleteById(matched.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    // rotation: delete matched row
    await this.refreshTokenService.deleteById(matched.id);

    // issue new tokens
    const existingUser = await this.usersService.findById(sub);
    if (!existingUser) {
      // shouldn't happen but safe-guard
      await this.refreshTokenService.deleteAllByUser(sub);
      throw new UnauthorizedException('User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.tokensService.getTokens(existingUser.id, existingUser.email, [
        existingUser.userType,
      ]);

    const expiresAt = this.getRefreshTokenExpiry();

    // save new refresh token
    await this.refreshTokenService.create(
      newRefreshToken,
      existingUser.id,
      expiresAt,
      clientMeta,
    );

    // enforce sessions limit
    const maxSessions = Number(
      this.configService.get<number>('REFRESH_TOKEN_MAX_SESSIONS') ?? 5,
    );
    await this.refreshTokenService.enforceMaxSessions(
      existingUser.id,
      maxSessions,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(rawRefreshToken: string) {
    // verify payload to get userId
    const JWT_REFRESH_SECRET =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: JWT_REFRESH_SECRET,
      });
    } catch (err) {
      // if token invalid -> nothing to revoke
      return;
    }

    const userId = Number(payload.sub);
    const matched = await this.refreshTokenService.findMatchingToken(
      userId,
      rawRefreshToken,
    );
    if (matched) {
      await this.refreshTokenService.deleteById(matched.id);
    }
    // done
  }

  // Logout all sessions
  async logoutAll(userId: number) {
    await this.refreshTokenService.deleteAllByUser(userId);
  }
}
