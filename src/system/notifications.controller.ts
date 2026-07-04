import { Controller, Get, Patch, Param, Query, Req, UseGuards, Sse, MessageEvent, Post, Body } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Sse('stream')
  sse(@Req() req: any): Observable<MessageEvent> {
    return this.notificationsService.getSseStream(req.user.id);
  }

  // Temporary endpoint so you can manually trigger a notification to yourself for testing!
  @Post('test-trigger')
  async triggerTestNotification(@Req() req: any, @Body('message') message: string) {
    return this.notificationsService.createNotification({
      userId: req.user.id,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Test Notification',
      message: message || 'This is a test notification triggered from Postman!',
    });
  }

  @Get()
  getUserNotifications(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, +page, +limit);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(req.user.id, notificationId);
  }
}
