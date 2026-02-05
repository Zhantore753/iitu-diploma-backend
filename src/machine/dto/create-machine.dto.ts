// src/machine/dto/create-machine.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMachineDto {
  @ApiProperty({ example: 'Трактор John Deere 8R' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: 'Мощный трактор для вспашки' })
  @IsString()
  description: string;

  @ApiProperty({ example: '340 л.с.', required: false })
  @IsOptional()
  @IsString()
  power?: string;

  @ApiProperty({ example: 'Иванов И.И.', required: false })
  @IsOptional()
  @IsString()
  executors?: string;

  @ApiProperty({ example: '8R 340', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 2023, required: false })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({ example: 'Алматы, ул. Абая 10' })
  @IsString()
  location: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  regionId: number;

  @ApiProperty({ example: 50000 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  pricePerDay: number;

  @ApiProperty({ 
    example: [1, 2], 
    type: [Number], 
    required: false,
    description: 'ID приспособлений' 
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') return value.split(',').map(v => Number(v.trim()));
    return value ? [Number(value)] : [];
  })
  @IsOptional()
  attachmentIds?: number[];

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  photos: any[];
}