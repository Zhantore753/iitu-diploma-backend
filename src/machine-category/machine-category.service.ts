import { Injectable } from '@nestjs/common';
import { MachineCategory, Prisma } from 'generated/prisma';
import { MachineCategoryRepository } from './machine-category.repository';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class MachineCategoryService {
  constructor(
    private readonly categoryRepository: MachineCategoryRepository,
  ) {}

  async findAll(
    skip?: number,
    take?: number,
  ): Promise<PaginatedResponseDto<MachineCategory>> {
    const [data, total] = await Promise.all([
      this.categoryRepository.findAll(
        undefined,
        { id: 'asc' },
        skip,
        take,
      ),
      this.categoryRepository.count(),
    ]);

    return {
      data,
      total,
      skip: skip || 0,
      take: take || data.length,
      hasMore: skip !== undefined && take !== undefined 
        ? skip + take < total 
        : false,
    };
  }

  async createSeedData(): Promise<void> {
    const categories = [
      'Тракторы',
      'Комбайны',
      'Посевная техника',
      'Уборочная техника',
      'Опрыскиватели',
      'Прицепы',
      'Плуги',
      'Культиваторы',
      'Бороны',
      'Катки',
      'Пресс-подборщики',
      'Косилки',
      'Фронтальные погрузчики',
      'Экскаваторы',
      'Бульдозеры',
    ];

    for (const name of categories) {
      const exists = await this.categoryRepository.findAll({
        name,
      });

      if (exists.length === 0) {
        await this.categoryRepository.create({ name });
      }
    }
  }
}