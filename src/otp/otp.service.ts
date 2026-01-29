// src/otp/otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_PREFIX = 'otp:';
  private readonly REG_PREFIX = 'reg:';
  private readonly VERIFIED_PREFIX = 'verified:';
    private readonly PASSWORD_RESET_PREFIX = 'password_reset:';

  constructor(private readonly redisService: RedisService) {}

  private generateOtp(): string {
    // Генерируем 6-значный OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async generateAndSendOtp(
    email: string,
  ): Promise<{ otp: string; expiry: Date }> {
    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Сохраняем OTP в Redis на 10 минут
    await this.redisService.set(`${this.OTP_PREFIX}${email}`, otp, 10 * 60);

    // TODO: Реальная отправка email
    this.logger.log(`OTP for ${email}: ${otp}`); // Для разработки

    // В продакшене:
    // await this.emailService.sendOtpEmail(email, otp);

    return { otp, expiry };
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redisService.get(`${this.OTP_PREFIX}${email}`);

    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    // Удаляем OTP после успешной проверки
    await this.redisService.del(`${this.OTP_PREFIX}${email}`);
    return true;
  }

  async storeRegistrationData(email: string, data: any): Promise<void> {
    // Сохраняем данные на 15 минут
    await this.redisService.set(
      `${this.REG_PREFIX}${email}`,
      JSON.stringify(data),
      15 * 60,
    );
  }

  async getRegistrationData(email: string): Promise<any> {
    const data = await this.redisService.get(`${this.REG_PREFIX}${email}`);
    return data ? JSON.parse(data) : null;
  }

  async markEmailAsVerified(email: string): Promise<void> {
    await this.redisService.set(
      `${this.VERIFIED_PREFIX}${email}`,
      'true',
      15 * 60, // 15 минут для завершения регистрации
    );
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const verified = await this.redisService.get(
      `${this.VERIFIED_PREFIX}${email}`,
    );
    return verified === 'true';
  }

  async clearRegistrationData(email: string): Promise<void> {
    await this.redisService.delMultiple([
      `${this.REG_PREFIX}${email}`,
      `${this.VERIFIED_PREFIX}${email}`,
    ]);
  }

  // Дополнительные методы для управления OTP
  async resendOtp(email: string): Promise<{ otp: string; expiry: Date }> {
    // Удаляем старый OTP если существует
    await this.redisService.del(`${this.OTP_PREFIX}${email}`);

    // Генерируем новый
    return this.generateAndSendOtp(email);
  }

  async cleanupExpiredData(): Promise<void> {
    // Redis автоматически удаляет данные с TTL,
    // но можно добавить дополнительную логику очистки
    this.logger.log('Cleanup expired OTP and registration data');
  }

  async storePasswordResetToken(
    email: string,
    hashedToken: string,
  ): Promise<void> {
    // Сохраняем на 1 час (время жизни токена)
    await this.redisService.set(
      `${this.PASSWORD_RESET_PREFIX}${email}`,
      hashedToken,
      60 * 60, // 1 час
    );
  }

  async getPasswordResetToken(email: string): Promise<string | null> {
    return await this.redisService.get(`${this.PASSWORD_RESET_PREFIX}${email}`);
  }

  async clearPasswordResetToken(email: string): Promise<void> {
    await this.redisService.del(`${this.PASSWORD_RESET_PREFIX}${email}`);
  }
}
