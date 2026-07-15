import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { UpdateSystemSettingDto } from '../dto/admin.dto';
import { AdminSettingsService } from '../services/admin-settings.service';

@Controller('admin/settings')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  async getSettings() {
    return this.adminSettingsService.getSettings();
  }

  @Get(':key')
  async getSettingByKey(@Param('key') key: string) {
    return this.adminSettingsService.getSettingByKey(key);
  }

  @Patch(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemSettingDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.id;
    return this.adminSettingsService.updateSetting(key, updateDto, adminId);
  }
}
