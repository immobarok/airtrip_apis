import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminCancelBookingDto } from '../dto/admin.dto';

@Injectable()
export class AdminBookingsService {
  constructor(private prisma: PrismaService) {}

  async getBookings(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (status) {
      whereClause.status = status; // BookingStatus enum formatting handled by Prisma
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          host: { select: { id: true, firstName: true, lastName: true, email: true } },
          listing: { select: { id: true, title: true } },
        },
      }),
      this.prisma.booking.count({ where: whereClause }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true, email: true } },
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, title: true } },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async cancelBooking(id: string, cancelDto: AdminCancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED_BY_ADMIN', 
      },
    });

    // In a real app, integrate with Payment module here to process refund based on cancelDto.refundPercentage
    // this.paymentService.processRefund(booking.paymentId, cancelDto.refundPercentage);

    return updatedBooking;
  }
}
