import { Prisma, Rental } from 'generated/prisma';

export abstract class IRentalRepository {
  abstract create(data: Prisma.RentalCreateInput): Promise<Rental>;
  abstract findAll(
    where?: Prisma.RentalWhereInput,
    orderBy?: Prisma.RentalOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Rental[]>;

  abstract findById(id: number, include?: any): Promise<Rental | null>;
  abstract update(id: number, data: Prisma.RentalUpdateInput): Promise<Rental>;
  abstract delete(id: number): Promise<Rental>;
  abstract count(where?: Prisma.RentalWhereInput): Promise<number>;
  abstract aggregate(
    options: Prisma.RentalAggregateArgs,
  ): Promise<Prisma.GetRentalAggregateType<Prisma.RentalAggregateArgs>>;

  abstract groupBy<T extends Prisma.RentalGroupByArgs>(
    options: Prisma.SelectSubset<T, Prisma.RentalGroupByArgs>,
  ): Promise<Prisma.GetRentalGroupByPayload<T>>;

  abstract hasConflict(machineId: number, startDate: Date, endDate: Date): Promise<boolean>;
}
