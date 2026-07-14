import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Run every day at midnight (or change to a specific time for testing if needed)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCheckCompletedTrips() {
    this.logger.log('Starting cron job: checkCompletedTrips');
    
    // We want to find bookings where checkOutDate was yesterday.
    // If it's 12:00 AM on July 15, we want bookings that checked out on July 14.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    try {
      const bookingsToReview = await this.prisma.booking.findMany({
        where: {
          checkOutDate: {
            gte: yesterday,
            lte: endOfYesterday,
          },
          status: 'CONFIRMED', // Using CONFIRMED assuming COMPLETED isn't a state in the enum
          // We should also check that a review doesn't already exist
          reviews: {
            none: {}
          }
        },
        include: {
          guest: true,
          listing: true,
        },
      });

      this.logger.log(`Found ${bookingsToReview.length} completed trips to send review emails for.`);

      for (const booking of bookingsToReview) {
        try {
          await this.mailService.sendReviewRequestEmail(
            booking.guest.email,
            booking.guest.firstName || 'Guest',
            booking.listing.title,
            booking.id,
          );
          this.logger.log(`Sent review email to ${booking.guest.email} for booking ${booking.id}`);
        } catch (mailError) {
          this.logger.error(`Failed to send review email to ${booking.guest.email}: ${mailError.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in checkCompletedTrips cron job: ${error.message}`);
    }
  }
}
