import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerateReviewDto } from '../dto/admin.dto';

@Injectable()
export class AdminReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviews(page = 1, limit = 10, isReported?: boolean) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (isReported !== undefined) {
      whereClause.isReported = isReported;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          reviewer: { select: { id: true, firstName: true, lastName: true } },
          reviewee: { select: { id: true, firstName: true, lastName: true } },
          listing: { select: { id: true, title: true } },
        },
      }),
      this.prisma.review.count({ where: whereClause }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async moderateReview(id: string, moderateDto: ModerateReviewDto, adminId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        isPublic: moderateDto.isPublic,
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
    });
  }
}
