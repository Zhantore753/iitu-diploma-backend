import { Injectable } from '@nestjs/common';
import { Region, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';

@Injectable()
export class RegionRepository extends BaseRepository<
  Region,
  Prisma.RegionCreateInput,
  Prisma.RegionUpdateInput,
  Prisma.RegionWhereInput,
  Prisma.RegionOrderByWithRelationInput,
  Prisma.RegionAggregateArgs,
  Prisma.RegionGroupByArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'region');
  }
}