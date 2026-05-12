import { Machine, Prisma } from 'generated/prisma';

export abstract class IMachineRepository {
  abstract create(data: Prisma.MachineCreateInput): Promise<Machine>;
  abstract findAll(
    where?: Prisma.MachineWhereInput,
    orderBy?: Prisma.MachineOrderByWithRelationInput,
    skip?: number,
    take?: number,
  ): Promise<Machine[]>;
  abstract findById(id: number): Promise<Machine | null>;
  abstract update(
    id: number,
    data: Prisma.MachineUpdateInput,
  ): Promise<Machine>;
  abstract delete(id: number): Promise<Machine>;
  abstract count(where?: Prisma.MachineWhereInput): Promise<number>;
  abstract aggregate(
    options: Prisma.MachineAggregateArgs,
  ): Promise<Prisma.GetMachineAggregateType<Prisma.MachineAggregateArgs>>;

  abstract groupBy<T extends Prisma.MachineGroupByArgs>(
    options: Prisma.SelectSubset<T, Prisma.MachineGroupByArgs>,
  ): Promise<Prisma.GetMachineGroupByPayload<T>>;

  abstract findByOwnerId(ownerId: number): Promise<Machine[]>;
}
