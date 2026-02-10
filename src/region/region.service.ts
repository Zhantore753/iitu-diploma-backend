import { Injectable } from '@nestjs/common';
import { Region, Prisma } from 'generated/prisma';
import { RegionRepository } from './region.repository';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class RegionService {
  constructor(
    private readonly regionRepository: RegionRepository,
  ) {}

  async findAll(
    skip?: number,
    take?: number,
  ): Promise<PaginatedResponseDto<Region>> {
    const [data, total] = await Promise.all([
      this.regionRepository.findAll(
        undefined,
        { id: 'asc' },
        skip,
        take,
      ),
      this.regionRepository.count(),
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
    const regions = [
      'Алматы',
      'Нур-Султан (Астана)',
      'Шымкент',
      'Акмолинская область',
      'Актюбинская область',
      'Алматинская область',
      'Атырауская область',
      'Восточно-Казахстанская область',
      'Жамбылская область',
      'Западно-Казахстанская область',
      'Карагандинская область',
      'Костанайская область',
      'Кызылординская область',
      'Мангистауская область',
      'Павлодарская область',
      'Северо-Казахстанская область',
      'Туркестанская область',
      'Улытауская область',
      'Абайская область',
      'Жетысуская область',
    ];

    for (const name of regions) {
      const exists = await this.regionRepository.findAll({
        name,
      });

      if (exists.length === 0) {
        await this.regionRepository.create({ name });
      }
    }
  }
}