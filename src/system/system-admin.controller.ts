import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { GetLogsDto } from './dto/get-logs.dto';

@Controller('system/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SystemAdminController {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Get('settings/:key')
  getSettingByKey(@Param('key') key: string) {
    return this.systemSettingsService.getSettingByKey(key);
  }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto, @Req() req: any) {
    return this.systemSettingsService.updateSetting(key, dto, req.user.id);
  }

  @Get('audit-logs')
  getAuditLogs(@Query() query: GetLogsDto) {
    return this.auditLogService.getLogs(query);
  }
}
