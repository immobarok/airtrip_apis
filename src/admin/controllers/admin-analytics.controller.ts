import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/analytics')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('dashboard-metrics')
  async getDashboardMetrics() {
    return this.adminAnalyticsService.getDashboardMetrics();
  }
}
