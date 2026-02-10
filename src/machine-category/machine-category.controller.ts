import {
    Controller,
    DefaultValuePipe,
    Get,
    ParseIntPipe,
    Post,
    Query
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { MachineCategory } from 'generated/prisma';
import { Public } from 'src/public/public.decorator';
import { MachineCategoryService } from './machine-category.service';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class MachineCategoryController {
  constructor(private readonly categoryService: MachineCategoryService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Получить список категорий с пагинацией',
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
    description: 'Список категорий успешно получен',
    type: PaginatedResponseDto<MachineCategory>,
  })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ): Promise<PaginatedResponseDto<MachineCategory>> {
    return this.categoryService.findAll(skip, take);
  }

  @Post('seed')
  @ApiOperation({
    summary: 'Заполнить базу тестовыми данными категорий',
    description: 'Создает стандартные категории сельхозтехники',
  })
  @ApiCreatedResponse({
    description: 'Тестовые данные успешно созданы',
  })
  async seed(): Promise<{ message: string }> {
    await this.categoryService.createSeedData();
    return { message: 'Seed data created successfully' };
  }
}
