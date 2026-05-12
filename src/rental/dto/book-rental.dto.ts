import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';

export class BookRentalDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  machineId: number;

  @ApiProperty({ example: '2026-06-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-06-10' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
