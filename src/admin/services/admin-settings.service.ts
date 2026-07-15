import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSystemSettingDto } from '../dto/admin.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { settingKey: 'asc' },
    });
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });
    if (!setting) {
      throw new NotFoundException(`System setting with key '${key}' not found`);
    }
    return setting;
  }

  async updateSetting(key: string, updateDto: UpdateSystemSettingDto, adminId: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });

    if (!setting) {
      throw new NotFoundException(`System setting with key '${key}' not found`);
    }

    if (!setting.isEditable) {
      throw new BadRequestException(`Setting '${key}' is not editable`);
    }

    return this.prisma.systemSetting.update({
      where: { settingKey: key },
      data: {
        settingValue: updateDto.settingValue,
        modifiedById: adminId,
      },
    });
  }
}
