import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminListingsController } from './controllers/admin-listings.controller';
import { AdminBookingsController } from './controllers/admin-bookings.controller';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminListingsService } from './services/admin-listings.service';
import { AdminBookingsService } from './services/admin-bookings.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminReviewsService } from './services/admin-reviews.service';
import { AdminAuditLogsService } from './services/admin-audit-logs.service';

import { AdminSupportController } from './controllers/admin-support.controller';
import { AdminPromotionsController } from './controllers/admin-promotions.controller';
import { AdminVerificationsController } from './controllers/admin-verifications.controller';
import { AdminAnnouncementsController } from './controllers/admin-announcements.controller';
import { AdminSupportService } from './services/admin-support.service';
import { AdminPromotionsService } from './services/admin-promotions.service';
import { AdminVerificationsService } from './services/admin-verifications.service';
import { AdminAnnouncementsService } from './services/admin-announcements.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminAnalyticsController,
    AdminUsersController,
    AdminListingsController,
    AdminBookingsController,
    AdminPaymentsController,
    AdminSettingsController,
    AdminReviewsController,
    AdminAuditLogsController,
    AdminSupportController,
    AdminPromotionsController,
    AdminVerificationsController,
    AdminAnnouncementsController,
  ],
  providers: [
    AdminAnalyticsService,
    AdminUsersService,
    AdminListingsService,
    AdminBookingsService,
    AdminPaymentsService,
    AdminSettingsService,
    AdminReviewsService,
    AdminAuditLogsService,
    AdminSupportService,
    AdminPromotionsService,
    AdminVerificationsService,
    AdminAnnouncementsService,
  ],
})
export class AdminModule {}
