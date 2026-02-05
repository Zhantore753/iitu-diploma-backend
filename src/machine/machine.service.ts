import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Machine, Prisma } from 'generated/prisma';
import { IMachineRepository } from './machine.repository.interface';
import { PaginatedMachineResponseDto } from './dto/response.dto';
import { CreateMachineDto } from './dto/create-machine.dto';
import { FileService } from 'src/file/file.service';

@Injectable()
export class MachineService {
  constructor(
    @Inject(IMachineRepository)
    private readonly machineRepo: IMachineRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private readonly fileService: FileService,
  ) {}

  async create(data: Prisma.MachineCreateInput): Promise<Machine> {
    try {
      const result = await this.machineRepo.create(data);
      await this.invalidateListCaches();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async createWithPhotos(
    ownerId: number,
    dto: CreateMachineDto,
    files: Express.Multer.File[],
  ) {
    // 1. Загрузка фото
    const photoUrls = await Promise.all(
      files.map((file) => this.fileService.upload(file, 'machines')),
    );

    // 2. Деструктуризация (извлекаем всё, что нужно обработать вручную)
    const {
      attachmentIds,
      categoryId,
      regionId,
      year,
      pricePerDay,
      photos,
      ...rest
    } = dto;

    // 3. Формируем объект для Prisma
    const data: Prisma.MachineCreateInput = {
      ...rest,
      year: year ? Number(year) : undefined,
      pricePerDay: Number(pricePerDay),
      owner: { connect: { id: ownerId } },
      category: { connect: { id: Number(categoryId) } },
      region: { connect: { id: Number(regionId) } },
      // Связи Many-to-Many
      attachments:
        attachmentIds && attachmentIds.length > 0
          ? {
              create: attachmentIds
                .filter((id) => !isNaN(id))
                .map((id) => ({
                  attachment: { connect: { id } },
                })),
            }
          : undefined,
      // Записи фото
      photos: {
        create: photoUrls.map((url) => ({ url })),
      },
    };

    const result = await this.machineRepo.create(data);
    await this.invalidateListCaches(); // Очистка кэша списка
    return result;
  }
  async findAll(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<PaginatedMachineResponseDto> {
    if (this.shouldCacheFindAll(where, skip, take)) {
      const data = await this.findWithCache(where, orderBy, skip, take);
      const total = await this.machineRepo.count(where);
      return {
        data,
        total,
        hasMore: false, // No pagination for cached queries
      };
    }

    const [data, total] = await Promise.all([
      this.machineRepo.findAll(where, orderBy, skip, take),
      this.machineRepo.count(where),
    ]);
    return {
      data,
      total,
      hasMore:
        skip !== undefined && take !== undefined ? skip + take < total : false,
    };
  }

  async findById(id: number): Promise<Machine> {
    const cacheKey = this.getCacheKey(id);

    const cached = await this.cacheManager.get<Machine>(cacheKey);
    if (cached) {
      return cached;
    }

    const machine = await this.machineRepo.findById(id);
    if (!machine)
      throw new NotFoundException(`Machine with ID ${id} not found`);

    await this.cacheManager.set(
      cacheKey,
      machine,
      this.configService.get('CACHE_TTL'),
    );
    return machine;
  }

  async update(
    id: number,
    ownerId: number,
    data: Prisma.MachineUpdateInput,
  ): Promise<Machine> {
    const machine = await this.findById(id);

    if (machine.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own machines');
    }

    try {
      const result = await this.machineRepo.update(id, data);
      await this.cacheManager.del(this.getCacheKey(id));
      await this.invalidateListCaches();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async delete(ownerId: number, id: number): Promise<Machine> {
    const machine = await this.findById(id);

    if (machine.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own machines');
    }

    const result = await this.machineRepo.delete(id);

    await this.cacheManager.del(this.getCacheKey(id));
    await this.invalidateListCaches();

    return result;
  }

  private getCacheKey(id: number): string {
    return `machine:${id}`;
  }

  private getListCacheKey(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): string {
    return `machines:list:${JSON.stringify({ where, orderBy, skip, take })}`;
  }

  private async invalidateListCaches(): Promise<void> {
    const invalidationKey = 'machines:list:invalidation';
    const currentVersion = Date.now().toString();
    await this.cacheManager.set(
      invalidationKey,
      currentVersion,
      this.configService.get('CACHE_LIST_TTL'),
    );
  }

  private async getListInvalidationVersion(): Promise<string> {
    const invalidationKey = 'machines:list:invalidation';
    return (await this.cacheManager.get<string>(invalidationKey)) || 'initial';
  }

  private shouldCacheFindAll(
    where?: Prisma.MachineWhereInput,
    skip?: number,
    take?: number,
  ): boolean {
    const hasPagination = skip !== undefined || take !== undefined;
    const isSimpleQuery = !where || Object.keys(where).length <= 2;

    return !hasPagination && isSimpleQuery;
  }

  private async findWithCache(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Machine[]> {
    const invalidationVersion = await this.getListInvalidationVersion();
    const cacheKey = `${this.getListCacheKey(where, orderBy, skip, take)}:v${invalidationVersion}`;

    const cached = await this.cacheManager.get<Machine[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.machineRepo.findAll(where, orderBy, skip, take);

    await this.cacheManager.set(
      cacheKey,
      result,
      this.configService.get('CACHE_LIST_TTL'),
    );

    return result;
  }
}
