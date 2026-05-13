import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookRentalDto } from './dto/book-rental.dto';
import { IRentalRepository } from './rental.repository.interface';

type RentalStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const ALLOWED_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Offset machine coordinates by status to simulate tracking movement */
function trackingCoords(
  status: RentalStatus,
  baseLat?: number | null,
  baseLng?: number | null,
): { machineLatitude?: number; machineLongitude?: number } {
  if (baseLat == null || baseLng == null) return {};
  const offsets: Record<RentalStatus, [number, number]> = {
    pending: [0.018, -0.012],
    confirmed: [0.009, -0.005],
    completed: [0, 0],
    cancelled: [0.014, 0.01],
  };
  const [dLat, dLng] = offsets[status];
  return {
    machineLatitude: Number((baseLat + dLat).toFixed(6)),
    machineLongitude: Number((baseLng + dLng).toFixed(6)),
  };
}

function diffDays(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

@Injectable()
export class RentalService {
  constructor(
    @Inject(IRentalRepository)
    private readonly rentalRepository: IRentalRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** Maps a full Prisma Rental (with includes) to the frontend Booking shape */
  serializeRental(rental: any) {
    const machine = rental.machine;
    const renter = rental.renter;
    const machineOwner = machine?.owner;

    return {
      id: String(rental.id),
      machineId: String(rental.machineId),
      machineName: machine?.name ?? '',
      machineImage: machine?.photos?.[0]?.url ?? '',
      machineCategory: machine?.category?.name ?? '',
      location: machine?.location ?? '',
      startDate: new Date(rental.startDate).toISOString(),
      endDate: new Date(rental.endDate).toISOString(),
      pricePerDay: Number(machine?.pricePerDay ?? 0),
      rentalDays: rental.rentalDays,
      totalPrice: Number(rental.totalPrice),
      region: machine?.region?.name ?? '',
      status: rental.status as RentalStatus,
      createdAt: new Date(rental.createdAt).toISOString(),
      updatedAt: new Date(rental.updatedAt).toISOString(),
      userId: rental.renterId,
      renterName: renter
        ? `${renter.firstName} ${renter.lastName}`.trim()
        : undefined,
      machineOwnerId: machineOwner?.id,
      providerName: machineOwner
        ? `${machineOwner.firstName} ${machineOwner.lastName}`.trim()
        : undefined,
      machineLatitude: rental.machineLatitude ?? undefined,
      machineLongitude: rental.machineLongitude ?? undefined,
      baseMachineLatitude: rental.baseMachineLatitude ?? undefined,
      baseMachineLongitude: rental.baseMachineLongitude ?? undefined,
      trackingUpdatedAt: rental.trackingUpdatedAt
        ? new Date(rental.trackingUpdatedAt).toISOString()
        : undefined,
      statusHistory: rental.statusHistory?.map((h: any) => ({
        status: h.status,
        changedAt: new Date(h.changedAt).toISOString(),
      })) ?? [],
    };
  }

  async bookRental(renterId: number, dto: BookRentalDto) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: dto.machineId },
    });

    if (!machine) throw new NotFoundException('Machine not found');
    if (machine.ownerId === renterId) {
      throw new BadRequestException('Owner cannot rent their own machine');
    }
    if (!machine.isAvailable) {
      throw new BadRequestException('Machine is not available for rental');
    }

    const hasConflict = await this.rentalRepository.hasConflict(
      dto.machineId,
      dto.startDate,
      dto.endDate,
    );
    if (hasConflict) {
      throw new BadRequestException('Machine is already booked for this period');
    }

    const rentalDays = diffDays(dto.startDate, dto.endDate);
    const totalPrice = Number(machine.pricePerDay) * rentalDays;
    const baseLat = machine.latitude;
    const baseLng = machine.longitude;
    const tracking = trackingCoords('pending', baseLat, baseLng);
    const now = new Date();

    const rental = await this.prisma.rental.create({
      data: {
        renter: { connect: { id: renterId } },
        machine: { connect: { id: dto.machineId } },
        startDate: dto.startDate,
        endDate: dto.endDate,
        rentalDays,
        totalPrice,
        status: 'pending',
        baseMachineLatitude: baseLat,
        baseMachineLongitude: baseLng,
        machineLatitude: tracking.machineLatitude,
        machineLongitude: tracking.machineLongitude,
        trackingUpdatedAt: now,
        statusHistory: {
          create: [{ status: 'pending', changedAt: now }],
        },
      },
      include: {
        statusHistory: { orderBy: { changedAt: 'asc' } },
        renter: { select: { id: true, firstName: true, lastName: true } },
        machine: {
          include: {
            photos: true,
            category: true,
            region: true,
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    return this.serializeRental(rental);
  }

  async myRentals(renterId: number) {
    const rentals = await this.rentalRepository.findAll({ renterId });
    return rentals.map((r) => this.serializeRental(r));
  }

  async providerRentals(ownerId: number) {
    const rentals = await this.rentalRepository.findAll({
      machine: { ownerId },
    });
    return rentals.map((r) => this.serializeRental(r));
  }

  async rentalDetails(rentalId: number, userId?: number) {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new NotFoundException('Rental not found');

    const r = rental as any;
    if (userId !== undefined) {
      const isRenter = r.renterId === userId;
      const isOwner = r.machine?.ownerId === userId;
      if (!isRenter && !isOwner) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.serializeRental(rental);
  }

  async transitionStatus(rentalId: number, userId: number, nextStatus: RentalStatus) {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) throw new NotFoundException('Rental not found');

    const r = rental as any;
    const currentStatus = r.status as RentalStatus;

    if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${currentStatus}' to '${nextStatus}'`,
      );
    }

    // Cancellation: either renter or provider can cancel
    if (nextStatus === 'cancelled') {
      const isRenter = r.renterId === userId;
      const isOwner = r.machine?.ownerId === userId;
      if (!isRenter && !isOwner) {
        throw new ForbiddenException('Only the renter or provider can cancel');
      }
    } else {
      // All other transitions (confirm, complete) are provider-only
      if (r.machine?.ownerId !== userId) {
        throw new ForbiddenException('Only the machine owner can perform this action');
      }
    }

    const now = new Date();
    const tracking = trackingCoords(nextStatus, r.baseMachineLatitude, r.baseMachineLongitude);

    const updated = await this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: nextStatus,
        machineLatitude: tracking.machineLatitude,
        machineLongitude: tracking.machineLongitude,
        trackingUpdatedAt: now,
        statusHistory: {
          create: [{ status: nextStatus, changedAt: now }],
        },
      },
      include: {
        statusHistory: { orderBy: { changedAt: 'asc' } },
        renter: { select: { id: true, firstName: true, lastName: true } },
        machine: {
          include: {
            photos: true,
            category: true,
            region: true,
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    return this.serializeRental(updated);
  }

  async cancelRental(rentalId: number, userId: number) {
    return this.transitionStatus(rentalId, userId, 'cancelled');
  }

  async getBookedDates(machineId: number) {
    const rentals = await this.prisma.rental.findMany({
      where: {
        machineId,
        status: { not: 'cancelled' },
      },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    });

    return rentals.map((r) => ({
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
    }));
  }
}
