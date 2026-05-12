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

  /** Maps a Prisma Machine record to the frontend-expected shape. */
  serializeMachine(machine: any) {
    const owner = machine.owner;
    const ownerName = owner
      ? `${owner.firstName} ${owner.lastName}`.trim()
      : undefined;

    return {
      id: String(machine.id),
      machineName: machine.name,
      category: machine.category?.name ?? '',
      description: machine.description,
      power: machine.power ?? '',
      executors: machine.executors,
      model: machine.model ?? '',
      yearOfManufacture: machine.year ? String(machine.year) : '',
      attachments: machine.attachments
        ?.map((a: any) => a.attachment?.name)
        .filter(Boolean)
        .join(', ') ?? '',
      photos: machine.photos?.map((p: any) => p.url) ?? [],
      rentalPrice: String(machine.pricePerDay),
      availabilityStart: machine.availabilityStart
        ? new Date(machine.availabilityStart).toISOString()
        : null,
      availabilityEnd: machine.availabilityEnd
        ? new Date(machine.availabilityEnd).toISOString()
        : null,
      location: machine.location,
      latitude: machine.latitude ?? undefined,
      longitude: machine.longitude ?? undefined,
      region: machine.region?.name ?? '',
      createdAt: new Date(machine.createdAt).toISOString(),
      ownerId: machine.ownerId,
      ownerName,
      isAvailable: machine.isAvailable,
    };
  }

  async createWithPhotos(
    ownerId: number,
    dto: CreateMachineDto,
    files: Express.Multer.File[],
  ) {
    const photoUrls = await Promise.all(
      files.map((file) => this.fileService.upload(file, 'machines')),
    );

    const {
      attachmentIds,
      categoryId,
      regionId,
      year,
      pricePerDay,
      latitude,
      longitude,
      availabilityStart,
      availabilityEnd,
      photos,
      ...rest
    } = dto;

    const data: Prisma.MachineCreateInput = {
      ...rest,
      year: year ? Number(year) : undefined,
      pricePerDay: Number(pricePerDay),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      availabilityStart: availabilityStart ?? undefined,
      availabilityEnd: availabilityEnd ?? undefined,
      owner: { connect: { id: ownerId } },
      category: { connect: { id: Number(categoryId) } },
      region: { connect: { id: Number(regionId) } },
      attachments:
        attachmentIds && attachmentIds.length > 0
          ? {
              create: attachmentIds
                .filter((id) => !isNaN(id))
                .map((id) => ({ attachment: { connect: { id } } })),
            }
          : undefined,
      photos: { create: photoUrls.map((url) => ({ url })) },
    };

    const result = await this.machineRepo.create(data);
    await this.invalidateListCaches();
    return this.serializeMachine(result);
  }

  async findAll(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<PaginatedMachineResponseDto> {
    if (this.shouldCacheFindAll(where, skip, take)) {
      const raw = await this.findWithCache(where, orderBy, skip, take);
      const total = await this.machineRepo.count(where);
      return { data: raw.map((m) => this.serializeMachine(m)), total, hasMore: false };
    }

    const [raw, total] = await Promise.all([
      this.machineRepo.findAll(where, orderBy, skip, take),
      this.machineRepo.count(where),
    ]);
    return {
      data: raw.map((m) => this.serializeMachine(m)),
      total,
      hasMore:
        skip !== undefined && take !== undefined ? skip + take < total : false,
    };
  }

  async findById(id: number): Promise<Machine> {
    const cacheKey = this.getCacheKey(id);

    const cached = await this.cacheManager.get<Machine>(cacheKey);
    if (cached) return cached;

    const machine = await this.machineRepo.findById(id);
    if (!machine) throw new NotFoundException(`Machine with ID ${id} not found`);

    await this.cacheManager.set(cacheKey, machine, this.configService.get('CACHE_TTL'));
    return machine;
  }

  async findByIdSerialized(id: number) {
    const machine = await this.findById(id);
    return this.serializeMachine(machine);
  }

  async getMyMachines(ownerId: number) {
    const machines = await this.machineRepo.findByOwnerId(ownerId);
    return machines.map((m) => this.serializeMachine(m));
  }

  async update(id: number, ownerId: number, data: Prisma.MachineUpdateInput): Promise<Machine> {
    const machine = await this.findById(id);
    if (machine.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own machines');
    }

    const result = await this.machineRepo.update(id, data);
    await this.cacheManager.del(this.getCacheKey(id));
    await this.invalidateListCaches();
    return result;
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
    await this.cacheManager.set(
      'machines:list:invalidation',
      Date.now().toString(),
      this.configService.get('CACHE_LIST_TTL'),
    );
  }

  private async getListInvalidationVersion(): Promise<string> {
    return (await this.cacheManager.get<string>('machines:list:invalidation')) || 'initial';
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
    if (cached) return cached;

    const result = await this.machineRepo.findAll(where, orderBy, skip, take);
    await this.cacheManager.set(cacheKey, result, this.configService.get('CACHE_LIST_TTL'));
    return result;
  }
}
