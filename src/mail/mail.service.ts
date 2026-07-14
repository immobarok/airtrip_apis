import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendVerificationOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Email Verification</h1>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
      `,
    });
  }

  async sendPasswordResetOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
      `,
    });
  }
  async sendReviewRequestEmail(
    email: string,
    userName: string,
    propertyName: string,
    bookingId: string,
  ) {
    const reviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trips/${bookingId}/review`;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `How was your trip to ${propertyName}? ✈️`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <h2>Hi ${userName},</h2>
          <p>We hope you had an amazing time at <strong>${propertyName}</strong>!</p>
          <p>Your trip has just ended, and we would love to hear about your experience. Your feedback helps future travelers and helps hosts improve their service.</p>
          <br/>
          <a href="${reviewUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Leave a Review
          </a>
          <br/><br/>
          <p>Thank you for choosing AirTrip!</p>
        </div>
      `,
    });
  }

  async sendBookingConfirmationEmail(
    email: string,
    userName: string,
    propertyName: string,
    bookingId: string,
    checkInDate: Date,
    checkOutDate: Date,
  ) {
    const tripUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trips`;
    const formattedCheckIn = checkInDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedCheckOut = checkOutDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
    const shortBookingId = bookingId.split('-')[0].toUpperCase();

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Booking Confirmed: ${propertyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f9fafb; }
            .wrapper { width: 100%; background-color: #f9fafb; padding: 40px 0; }
            .container { max-w: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #4f46e5; padding: 32px 40px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px; }
            .greeting { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px; color: #111827; }
            .message { font-size: 16px; color: #4b5563; margin-bottom: 32px; }
            .booking-card { background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0; }
            .property-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px; }
            .details-grid { display: table; width: 100%; }
            .detail-row { display: table-row; }
            .detail-label { display: table-cell; padding-bottom: 12px; color: #64748b; font-size: 14px; font-weight: 500; width: 40%; }
            .detail-value { display: table-cell; padding-bottom: 12px; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; }
            .cta-container { text-align: center; margin: 40px 0 20px; }
            .cta-button { background-color: #4f46e5; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3); }
            .footer { background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 0 0 10px; font-size: 14px; color: #64748b; }
            .footer a { color: #4f46e5; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>AirTrip</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${userName},</p>
                <p class="message">Great news! Your host has officially confirmed your reservation. We're thrilled to help you get away, and we've got all the details of your upcoming trip right here.</p>
                
                <div class="booking-card">
                  <h3 class="property-name">${propertyName}</h3>
                  <div class="details-grid">
                    <div class="detail-row">
                      <div class="detail-label">Booking Ref</div>
                      <div class="detail-value">#${shortBookingId}</div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-label">Check-in</div>
                      <div class="detail-value">${formattedCheckIn}</div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-label">Check-out</div>
                      <div class="detail-value">${formattedCheckOut}</div>
                    </div>
                  </div>
                </div>
                
                <div class="cta-container">
                  <a href="${tripUrl}" class="cta-button">Manage Your Trip</a>
                </div>
                
                <p style="font-size: 16px; color: #4b5563; margin-bottom: 0;">Safe travels,<br><strong style="color: #111827;">The AirTrip Team</strong></p>
              </div>
              <div class="footer">
                <p>Need help with your booking? Visit our <a href="#">Help Center</a>.</p>
                <p>&copy; ${new Date().getFullYear()} AirTrip Inc. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
