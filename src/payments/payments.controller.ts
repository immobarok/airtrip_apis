import { Controller, Post, Param, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as express from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session/:bookingId')
  async createCheckoutSession(
    @Param('bookingId') bookingId: string,
    @Req() req: unknown,
  ) {
    const request = req as express.Request & { user: { id: string } };
    const userId = request.user.id;
    return this.paymentsService.createCheckoutSession(bookingId, userId);
  }

  // Webhooks do not use JwtAuthGuard, because they are called by Stripe, not the user
  @Post('webhook')
  async handleWebhook(@Req() req: unknown) {
    const request = req as RawBodyRequest<express.Request>;
    return this.paymentsService.handleWebhook(request);
  }
}
