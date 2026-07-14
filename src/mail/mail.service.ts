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

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: `Your booking for ${propertyName} is confirmed! 🎊`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <h2>Hi ${userName},</h2>
          <p>Great news! Your booking at <strong>${propertyName}</strong> has been confirmed by the host.</p>
          <p><strong>Check-in:</strong> ${checkInDate.toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${checkOutDate.toLocaleDateString()}</p>
          <br/>
          <a href="${tripUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Your Trip
          </a>
          <br/><br/>
          <p>Get ready for your next adventure with AirTrip!</p>
        </div>
      `,
    });
  }
}
