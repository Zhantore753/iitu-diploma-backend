import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
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
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'StrongP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
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

export class CompleteRegistrationDto extends RegisterInitDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'OTP код подтверждения',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  tempToken: string;

  @ApiProperty({
    description: 'Тип пользователя',
    enum: UserType,
    example: UserType.admin, 
  })
  @IsEnum(UserType)
  userType: UserType;
}
