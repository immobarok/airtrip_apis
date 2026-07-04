import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SystemSettingsService } from './system-settings.service';
import { AuditLogService } from './audit-log.service';
import { SystemAdminController } from './system-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, SystemAdminController],
  providers: [NotificationsService, SystemSettingsService, AuditLogService],
  exports: [NotificationsService, SystemSettingsService, AuditLogService],
})
export class SystemModule {}
