import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { AdminAuditLogsService } from '../services/admin-audit-logs.service';

@Controller('admin/audit-logs')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminAuditLogsController {
  constructor(private readonly adminAuditLogsService: AdminAuditLogsService) {}

  @Get()
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.adminAuditLogsService.getAuditLogs(
      Number(page),
      Number(limit),
      action,
      entityType,
    );
  }
}
