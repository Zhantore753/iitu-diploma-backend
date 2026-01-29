import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { UserType } from 'generated/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Сильный пароль пользователя',
    example: 'Password123',
    minLength: 8,
  })
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  password: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Марсель',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Биссенгалиев',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({
    description: 'Телефон пользователя (формат Казахстана)',
    example: '+77012345678',
  })
  @IsPhoneNumber('KZ')
  phone: string;

  @ApiProperty({
    description: 'Тип пользователя',
    enum: UserType,
    example: UserType.admin, // укажи пример из твоего enum
  })
  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  isVerified?: boolean;

  bio?: string;

  avatar: string | null;
}


export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'newemail@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Новое имя',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Новая фамилия',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Номер телефона',
    example: '+77071234567',
  })
  @IsOptional()
  @IsPhoneNumber('KZ')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Аватар пользователя',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Биография пользователя',
    example: 'Новая биография...',
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Адрес пользователя',
    example: 'г. Алматы, ул. Примерная, д. 1',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Тип пользователя',
    enum: UserType,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({
    description: 'Статус верификации',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Статус активности',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}