import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { HostResponseDto } from './dto/host-response.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== userId) {
      throw new ForbiddenException(
        'You can only review bookings where you were the guest',
      );
    }

    if (
      [
        'CANCELLED_BY_GUEST',
        'CANCELLED_BY_HOST',
        'CANCELLED_BY_ADMIN',
      ].includes(booking.status)
    ) {
      throw new BadRequestException('You cannot review a cancelled booking');
    }

    const now = new Date();
    if (new Date(booking.checkOutDate) > now) {
      throw new BadRequestException(
        'You can only review a booking after the checkout date has passed',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: booking.id },
    });

    if (existing) {
      throw new BadRequestException('A review for this booking already exists');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        reviewerId: userId,
        revieweeId: booking.hostId,
        overallRating: dto.overallRating,
        cleanliness: dto.cleanliness,
        accuracy: dto.accuracy,
        checkIn: dto.checkIn,
        communication: dto.communication,
        locationRating: dto.locationRating,
        value: dto.value,
        comment: dto.comment,
        isPublic: true,
      },
    });

    await this.updateListingRating(booking.listingId);

    return review;
  }

  async getListingReviews(listingId: string, query: GetReviewsDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { listingId, isPublic: true };

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserReviews(userId: string, query: GetReviewsDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { revieweeId: userId, isPublic: true };

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          listing: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addHostResponse(
    reviewId: string,
    hostId: string,
    dto: HostResponseDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { listing: true },
    });

    if (!review) throw new NotFoundException('Review not found');

    if (review.listing.hostId !== hostId) {
      throw new ForbiddenException(
        'You can only respond to reviews on your own properties',
      );
    }

    if (review.hostResponse) {
      throw new BadRequestException('A response has already been provided');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostResponse: dto.response,
        hostRespondedAt: new Date(),
      },
    });
  }

  async updateListingRating(listingId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { listingId, isPublic: true },
      _avg: { overallRating: true },
      _count: { id: true },
    });

    const averageRating = stats._avg.overallRating || 0;
    const totalReviews = stats._count.id;

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      },
    });

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (listing) {
      const hostStats = await this.prisma.review.aggregate({
        where: { revieweeId: listing.hostId, isPublic: true },
        _avg: { overallRating: true },
        _count: { id: true },
      });
      await this.prisma.hostProfile
        .update({
          where: { userId: listing.hostId },
          data: {
            averageRating: Number(
              (hostStats._avg.overallRating || 0).toFixed(1),
            ),
            totalReviews: hostStats._count.id,
          },
        })
        .catch(() => {});
    }
  }
}
