import { Injectable } from '@nestjs/common';
import { Machine, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { IMachineRepository } from './machine.repository.interface';

const MACHINE_INCLUDE = {
  photos: true,
  category: true,
  region: true,
  owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  attachments: { include: { attachment: true } },
} satisfies Prisma.MachineInclude;

@Injectable()
export class MachineRepository
  extends BaseRepository<
    Machine,
    Prisma.MachineCreateInput,
    Prisma.MachineUpdateInput,
    Prisma.MachineWhereInput,
    Prisma.MachineOrderByWithRelationInput,
    Prisma.MachineAggregateArgs,
    Prisma.MachineGroupByArgs
  >
  implements IMachineRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'machine');
  }

  override findAll(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Machine[]> {
    return this.prisma.machine.findMany({
      where,
      orderBy,
      skip,
      take,
      include: MACHINE_INCLUDE,
    }) as unknown as Promise<Machine[]>;
  }

  override findById(id: number): Promise<Machine | null> {
    return this.prisma.machine.findUnique({
      where: { id },
      include: MACHINE_INCLUDE,
    }) as unknown as Promise<Machine | null>;
  }

  findByOwnerId(ownerId: number): Promise<Machine[]> {
    return this.prisma.machine.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: MACHINE_INCLUDE,
    }) as unknown as Promise<Machine[]>;
  }
}
