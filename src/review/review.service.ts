import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(review: any) {
    return {
      id: review.id,
      rating: review.rating,
      text: review.text ?? null,
      createdAt: new Date(review.createdAt).toISOString(),
      renterId: review.renterId,
      renterName: review.renter
        ? `${review.renter.firstName} ${review.renter.lastName}`.trim()
        : null,
      renterAvatar: review.renter?.avatar ?? null,
    };
  }

  async getMachineReviews(machineId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { machineId },
      orderBy: { createdAt: 'desc' },
      include: {
        renter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    return {
      reviews: reviews.map((r) => this.serialize(r)),
      averageRating,
      totalCount,
    };
  }

  async createReview(
    renterId: number,
    dto: { machineId: number; rentalId: number; rating: number; text?: string },
  ) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
    });

    if (!rental) throw new NotFoundException('Rental not found');
    if (rental.renterId !== renterId) {
      throw new ForbiddenException('You can only review your own rentals');
    }
    if (rental.status !== 'completed') {
      throw new ForbiddenException('You can only review completed rentals');
    }
    if (rental.machineId !== dto.machineId) {
      throw new ForbiddenException('Rental does not match this machine');
    }

    const existing = await this.prisma.review.findUnique({
      where: { machineId_renterId: { machineId: dto.machineId, renterId } },
    });
    if (existing) {
      throw new ForbiddenException('You have already reviewed this machine');
    }

    const review = await this.prisma.review.create({
      data: {
        machineId: dto.machineId,
        renterId,
        rentalId: dto.rentalId,
        rating: dto.rating,
        text: dto.text ?? null,
      },
      include: {
        renter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    return this.serialize(review);
  }

  async getRecentReviews(take: number) {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        renter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        machine: { select: { id: true, name: true } },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
      renterName: r.renter ? `${r.renter.firstName} ${r.renter.lastName}`.trim() : null,
      renterAvatar: r.renter?.avatar ?? null,
      machineId: r.machineId,
      machineName: r.machine?.name ?? null,
    }));
  }

  async canReview(renterId: number, machineId: number) {
    // Find a completed rental for this machine by this user
    const rental = await this.prisma.rental.findFirst({
      where: { machineId, renterId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    if (!rental) return { canReview: false, rentalId: null };

    // Check no review exists yet
    const existing = await this.prisma.review.findUnique({
      where: { machineId_renterId: { machineId, renterId } },
    });

    if (existing) return { canReview: false, rentalId: null };

    return { canReview: true, rentalId: rental.id };
  }
}
