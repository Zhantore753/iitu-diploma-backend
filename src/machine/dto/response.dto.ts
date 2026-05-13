import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMachineResponseDto {
  @ApiProperty()
  data: Record<string, any>[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: false })
  hasMore: boolean;
}
