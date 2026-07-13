import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsDto } from './dto/get-bookings.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private generateBookingReference(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createBooking(guestId: string, dto: CreateBookingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId === guestId) {
      throw new BadRequestException('You cannot book your own listing');
    }

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Check availability
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        listingId: dto.listingId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
        },
        OR: [
          {
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException('Listing is not available for the selected dates');
    }

    // Calculate nights and prices
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (listing.minNights && numberOfNights < listing.minNights) {
      throw new BadRequestException(`Minimum stay is ${listing.minNights} nights`);
    }
    if (listing.maxNights && numberOfNights > listing.maxNights) {
      throw new BadRequestException(`Maximum stay is ${listing.maxNights} nights`);
    }

    const nightlyRate = Number(listing.basePricePerNight);
    const subtotal = nightlyRate * numberOfNights;
    const cleaningFee = Number(listing.cleaningFee || 0);
    const serviceFeePercent = Number(listing.serviceFeePercent || 12);
    const serviceFee = (subtotal * serviceFeePercent) / 100;
    const totalAmount = subtotal + cleaningFee + serviceFee;

    const booking = await this.prisma.booking.create({
      data: {
        bookingReference: this.generateBookingReference(),
        listingId: dto.listingId,
        guestId,
        hostId: listing.hostId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: dto.numberOfGuests,
        guestNames: dto.guestNames || [],
        specialRequests: dto.specialRequests,
        nightlyRate,
        numberOfNights,
        subtotal,
        cleaningFee,
        serviceFee,
        totalAmount,
        status: BookingStatus.PENDING,
      },
    });

    return booking;
  }

  async getGuestBookings(guestId: string, query: GetBookingsDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { guestId };
    if (status) where.status = status;

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              photos: {
                select: {
                  photoUrl: true,
                  isPrimary: true,
                },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
          host: {
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
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHostBookings(hostId: string, query: GetBookingsDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { hostId };
    if (status) where.status = status;

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              photos: {
                select: {
                  photoUrl: true,
                  isPrimary: true,
                },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
          guest: {
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
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingDetails(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        guest: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        host: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== userId && booking.hostId !== userId) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return booking;
  }

  async updateBookingStatus(bookingId: string, userId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHost = booking.hostId === userId;
    const isGuest = booking.guestId === userId;

    if (!isHost && !isGuest) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Basic status transition validation could be added here
    // For now, let's just enforce that guests can only cancel their own booking
    if (isGuest && dto.status !== BookingStatus.CANCELLED_BY_GUEST) {
      throw new ForbiddenException('Guests can only cancel their bookings');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }
}
