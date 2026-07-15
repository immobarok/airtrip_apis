import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminAnnouncementsService } from '../services/admin-announcements.service';

@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAnnouncementsController {
  constructor(
    private readonly announcementsService: AdminAnnouncementsService,
  ) {}

  @Get()
  async getAnnouncements(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.announcementsService.getAnnouncements(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Post()
  async createAnnouncement(
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    const data = await this.announcementsService.createAnnouncement(
      title,
      content,
    );
    return { success: true, data };
  }
}
