import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { UserType } from 'generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

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
