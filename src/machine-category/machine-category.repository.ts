import { Injectable } from '@nestjs/common';
import { MachineCategory, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';

@Injectable()
export class MachineCategoryRepository extends BaseRepository<
  MachineCategory,
  Prisma.MachineCategoryCreateInput,
  Prisma.MachineCategoryUpdateInput,
  Prisma.MachineCategoryWhereInput,
  Prisma.MachineCategoryOrderByWithRelationInput,
  Prisma.MachineCategoryAggregateArgs,
  Prisma.MachineCategoryGroupByArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'machineCategory');
  }
}