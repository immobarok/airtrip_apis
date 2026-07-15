import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { AdminCancelBookingDto } from '../dto/admin.dto';
import { AdminBookingsService } from '../services/admin-bookings.service';

@Controller('admin/bookings')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @Get()
  async getBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.adminBookingsService.getBookings(
      Number(page),
      Number(limit),
      status,
    );
  }

  @Get(':id')
  async getBookingById(@Param('id') id: string) {
    return this.adminBookingsService.getBookingById(id);
  }

  @Patch(':id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @Body() cancelDto: AdminCancelBookingDto,
  ) {
    return this.adminBookingsService.cancelBooking(id, cancelDto);
  }
}
