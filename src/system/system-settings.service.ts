import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SystemSettingsService {
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
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return setting;
  }

  async updateSetting(key: string, dto: UpdateSettingDto, userId: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return this.prisma.systemSetting.update({
      where: { settingKey: key },
      data: {
        settingValue: dto.value,
        description: dto.description ?? setting.description,
        modifiedById: userId,
      },
    });
  }
}
