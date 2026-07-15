import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { UpdateListingStatusDto } from '../dto/admin.dto';
import { AdminListingsService } from '../services/admin-listings.service';

@Controller('admin/listings')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminListingsController {
  constructor(private readonly adminListingsService: AdminListingsService) {}

  @Get()
  async getListings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.adminListingsService.getListings(
      Number(page),
      Number(limit),
      status,
    );
  }

  @Get(':id')
  async getListingById(@Param('id') id: string) {
    return this.adminListingsService.getListingById(id);
  }

  @Patch(':id/status')
  async updateListingStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateListingStatusDto,
  ) {
    return this.adminListingsService.updateListingStatus(id, updateDto);
  }

  @Delete(':id/photos/:photoId')
  async deleteListingPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.adminListingsService.deleteListingPhoto(id, photoId);
  }
}
