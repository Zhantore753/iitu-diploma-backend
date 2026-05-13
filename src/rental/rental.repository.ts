import { Injectable } from '@nestjs/common';
import { Prisma, Rental } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';

const RENTAL_INCLUDE = {
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  renter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  machine: {
    include: {
      photos: true,
      category: true,
      region: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.RentalInclude;

@Injectable()
export class RentalRepository
  extends BaseRepository<
    Rental,
    Prisma.RentalCreateInput,
    Prisma.RentalUpdateInput,
    Prisma.RentalWhereInput,
    Prisma.RentalOrderByWithRelationInput,
    Prisma.RentalAggregateArgs,
    Prisma.RentalGroupByArgs
  >
{
  constructor(prisma: PrismaService) {
    super(prisma, 'rental');
  }

  override findAll(
    where?: Prisma.RentalWhereInput,
    orderBy?: Prisma.RentalOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Rental[]> {
    return this.prisma.rental.findMany({
      where,
      orderBy: orderBy ?? { createdAt: 'desc' },
      skip,
      take,
      include: RENTAL_INCLUDE,
    }) as unknown as Promise<Rental[]>;
  }

  override findById(id: number, include?: any): Promise<Rental | null> {
    return this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    }) as unknown as Promise<Rental | null>;
  }

  /** Check if a machine has an overlapping non-cancelled booking */
  async hasConflict(machineId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const count = await this.prisma.rental.count({
      where: {
        machineId,
        status: { not: 'cancelled' },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    return count > 0;
  }
}
