import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Список элементов' })
  data: T[];

  @ApiProperty({ description: 'Общее количество элементов' })
  total: number;

  @ApiProperty({ description: 'Количество пропущенных элементов' })
  skip: number;

  @ApiProperty({ description: 'Количество взятых элементов' })
  take: number;

  @ApiProperty({ description: 'Есть ли еще элементы для загрузки' })
  hasMore: boolean;
}