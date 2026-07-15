import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalUsers, activeUsers, activeListings, pendingListings, bookingsThisMonth, totalRevenueResult] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.listing.count({ where: { status: 'active' } }),
        this.prisma.listing.count({ where: { status: 'pending' } }),
        this.prisma.booking.count({
          where: {
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
        }),
        this.prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: 'COMPLETED', // Use Prisma enum formatting if applicable
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      activeListings,
      pendingListings,
      bookingsThisMonth,
      totalRevenue: totalRevenueResult._sum.amount || 0,
    };
  }
}
