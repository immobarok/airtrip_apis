import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto';
import { Role } from '../common/decorators/roles.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private mail: MailService,
  ) { }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(dto.password, salt);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
        isCustomer: true,
        isVerified: false,
        isEmailVerified: false,
        customerProfile: {
          create: {},
        },
      },
    });

    const otp = this.generateOtp();
    await this.redis.set(
      `verify_email:${dto.email}`,
      otp,
      Number(process.env.OTP_EXPIRY_SECONDS) || 300,
    );

    // Fire-and-forget email sending
    this.mail.sendVerificationOtp(dto.email, otp).catch((err) => {
      this.logger.error(
        `Failed to send verification email to ${dto.email}`,
        err.stack,
      );
    });

    return { message: 'User registered successfully. Please check your email for the verification OTP.' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const roles: string[] = [];
    if (user.isCustomer) roles.push(Role.CUSTOMER);
    if (user.isHost) roles.push(Role.HOST);
    if (user.isAdmin) roles.push(Role.ADMIN);
    if (user.isSuperAdmin) roles.push(Role.SUPER_ADMIN);

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      isVerified: user.isVerified,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const storedOtp = await this.redis.get(`verify_email:${dto.email}`);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        isVerified: true,
        isEmailVerified: true
      },
    });

    await this.redis.del(`verify_email:${dto.email}`);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) return { message: 'If email exists, OTP sent' };

    const otp = this.generateOtp();
    await this.redis.set(
      `reset_password:${dto.email}`,
      otp,
      Number(process.env.OTP_EXPIRY_SECONDS) || 300,
    );

    // Fire-and-forget: don't block the response waiting for SMTP
    this.mail.sendPasswordResetOtp(dto.email, otp).catch((err) => {
      this.logger.error(
        `Failed to send password reset email to ${dto.email}`,
        err.stack,
      );
    });

    return { message: 'If email exists, OTP sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const storedOtp = await this.redis.get(`reset_password:${dto.email}`);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash: hash },
    });

    await this.redis.del(`reset_password:${dto.email}`);
    return { message: 'Password reset successfully' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException('User not found');

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async becomeHost(userId: string) {
    // Check if user is already a host
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { hostProfile: true }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isHost) {
      return { message: 'You are already a host!' };
    }

    // Update user to be a host and create HostProfile
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isHost: true,
        hostProfile: {
          create: {}
        }
      }
    });

    return {
      message: 'Congratulations! You are now a host. Please login again to refresh your permissions.',
      requiresReLogin: true
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostProfile: true,
        customerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async logout() {
    // With stateless JWTs, logout is largely client-side token deletion.
    // Here we can return a success message.
    return { message: 'Logged out successfully' };
  }
}
