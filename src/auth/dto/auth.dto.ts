import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { UserType } from 'generated/prisma';

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'OldPassword123!', 
    description: 'Текущий пароль пользователя' 
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    example: 'NewSafePass2026', 
    description: 'Новый пароль' 
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ 
    example: 'NewSafePass2026', 
    description: 'Подтверждение нового пароля' 
  })
  @IsString()
  confirmPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email пользователя для восстановления пароля',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Токен сброса пароля, полученный по email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'NewStrongP@ssw0rd',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Подтверждение нового пароля',
    example: 'NewStrongP@ssw0rd',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}

export class VerifyResetTokenDto {
  @ApiProperty({
    description: 'Токен сброса пароля для проверки',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;
}

export class AuthDto {
  @ApiProperty({
    description: 'Email пользователя для входа',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'StrongP@ssw0rd',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterInitDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'StrongP@ssw0rd',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
    minLength: 2,
    maxLength: 50,
    required: true,
  })
  @IsString()
  @Length(2, 50)
  firstName: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'OTP код подтверждения, отправленный на email',
    example: '123456',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class CompleteRegistrationDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Временный токен, полученный после подтверждения email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString()
  tempToken: string;

  @ApiProperty({
    description: 'Тип пользователя',
    enum: UserType,
    example: UserType.farmer,
    required: true,
  })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({
    description: 'Уникальный никнейм пользователя',
    example: 'john_doe',
    minLength: 2,
    maxLength: 30,
    required: true,
  })
  @IsString()
  @Length(2, 30)
  nickname: string;

  @ApiProperty({
    description: 'Номер телефона в формате Казахстана',
    example: '+77071234567',
    required: true,
  })
  @IsPhoneNumber('KZ')
  phone: string;

  @ApiPropertyOptional({
    description: 'Краткая биография пользователя',
    example: 'Люблю программировать и изучать новые технологии.',
    maxLength: 300,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  bio?: string;
}

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Johnny', nullable: true })
  lastName?: string;

  @ApiProperty({ example: '+79991234567', nullable: true })
  phone?: string;

  @ApiProperty({ example: 'https://storage.com/avatar.png', nullable: true })
  avatar?: string;

  @ApiProperty({ enum: UserType, example: UserType.admin })
  userType: UserType;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}