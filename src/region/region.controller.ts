import {
    Controller,
    DefaultValuePipe,
    Get,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Region } from 'generated/prisma';
import { Public } from 'src/public/public.decorator';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { RegionService } from './region.service';

@ApiTags('regions')
@ApiBearerAuth()
@Controller('regions')
export class RegionController {
  constructor(
    private readonly regionService: RegionService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Получить список регионов с пагинацией',
    description: 'Используется для лоада на скролле',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Количество элементов для пропуска',
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Количество элементов для получения',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Список регионов успешно получен',
    type: PaginatedResponseDto<Region>,
  })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ): Promise<PaginatedResponseDto<Region>> {
    return this.regionService.findAll(skip, take);
  }

  @Post('seed')
  @ApiOperation({
    summary: 'Заполнить базу тестовыми данными регионов',
    description: 'Создает стандартные регионы Казахстана',
  })
  @ApiCreatedResponse({
    description: 'Тестовые данные успешно созданы',
  })
  async seed(): Promise<{ message: string }> {
    await this.regionService.createSeedData();
    return { message: 'Seed data created successfully' };
  }
}