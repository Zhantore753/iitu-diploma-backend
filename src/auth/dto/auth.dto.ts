import { ApiProperty } from '@nestjs/swagger';
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

export class AuthDto {
  @ApiProperty({
    description: 'Email пользователя для входа',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'StrongP@ssw0rd',
    minLength: 8,
  })
  password: string;
}

export class RegisterInitDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(2, 50)
  firstName: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'OTP код подтверждения',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class CompleteRegistrationDto {
  @IsEmail()
  email: string;

  @IsString()
  tempToken: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsString()
  @Length(2, 30)
  nickname: string;

  @IsPhoneNumber('KZ')
  phone: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  bio?: string;
}

