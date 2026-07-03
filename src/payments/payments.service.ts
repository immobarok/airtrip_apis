import { Injectable, NotFoundException, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import * as express from 'express';
import { BookingStatus, PaymentStatus } from '@prisma/client'; // Assuming these enums exist

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') as string,
      {
        apiVersion: '2026-06-24.dahlia', // Latest Stripe API version
      },
    );
  }

  async createCheckoutSession(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== userId) {
      throw new BadRequestException('You are not authorized to pay for this booking');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException(`Booking is in ${booking.status} status and cannot be paid for`);
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `http://localhost:3000/payment/success?booking_id=${booking.id}`,
      cancel_url: `http://localhost:3000/payment/cancel?booking_id=${booking.id}`,
      customer_email: undefined, // You can pass the user email here if available
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        guestId: booking.guestId,
        hostId: booking.hostId,
      },
      line_items: [
        {
          price_data: {
            currency: booking.currency?.toLowerCase() || 'usd',
            product_data: {
              name: `Booking for ${booking.listing.title}`,
              description: `Check-in: ${booking.checkInDate.toISOString().split('T')[0]} | Check-out: ${booking.checkOutDate.toISOString().split('T')[0]}`,
            },
            unit_amount: Math.round(Number(booking.totalAmount) * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
    });

    return { checkoutUrl: session.url };
  }

  async handleWebhook(req: RawBodyRequest<express.Request>) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      if (!sig || !req.rawBody || !webhookSecret) {
        throw new Error('Missing signature, raw body or webhook secret');
      }
      event = this.stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook Error: ${errorMessage}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const bookingId = session.metadata?.bookingId;
      const guestId = session.metadata?.guestId;
      const hostId = session.metadata?.hostId;

      if (bookingId && guestId && hostId) {
        // Update Booking Status
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' },
        });

        // Record the Payment
        await this.prisma.payment.create({
          data: {
            bookingId: bookingId,
            payerId: guestId,
            payeeId: hostId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase() || 'USD',
            paymentMethod: 'CREDIT_CARD', // Adjust based on your schema's PaymentMethod enum
            paymentStatus: 'COMPLETED', // Adjust based on your schema's PaymentStatus enum
            processor: 'STRIPE',
            processorPaymentId: session.payment_intent as string,
            paidAt: new Date(),
          },
        });
      }
    }

    return { received: true };
  }
}
