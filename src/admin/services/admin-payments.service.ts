import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminPaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPayments(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (status) {
      whereClause.paymentStatus = status; // PAYMENT_STATUS enum handled by Prisma
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          payer: { select: { id: true, firstName: true, lastName: true, email: true } },
          payee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.payment.count({ where: whereClause }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processPayout(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Process payout logic...

    return { message: 'Payout processed successfully' };
  }
}
