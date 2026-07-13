import { Controller, Post, Body, Get, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsDto } from './dto/get-bookings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.createBooking(userId, createBookingDto);
  }

  @Get('guest')
  getGuestBookings(@CurrentUser('id') userId: string, @Query() query: GetBookingsDto) {
    return this.bookingsService.getGuestBookings(userId, query);
  }

  @Get('host')
  getHostBookings(@CurrentUser('id') userId: string, @Query() query: GetBookingsDto) {
    return this.bookingsService.getHostBookings(userId, query);
  }

  @Get('host/statistics')
  getHostStatistics(@CurrentUser('id') userId: string) {
    return this.bookingsService.getHostStatistics(userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.getBookingDetails(id, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.updateBookingStatus(id, userId, updateBookingStatusDto);
  }
}
