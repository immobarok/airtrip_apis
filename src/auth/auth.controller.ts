import { Body, Controller, Post, Request, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, HostOnboardDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    const userId = user?.sub || user?.id;
    return this.authService.getMe(userId);
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleAuth(@Req() req) {
    // initiates the Google OAuth flow
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @UseGuards(AuthGuard('facebook'))
  @Get('facebook')
  async facebookAuth(@Req() req) {
    // initiates the Facebook OAuth flow
  }

  @UseGuards(AuthGuard('facebook'))
  @Get('facebook/callback')
  async facebookAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('become-host')
  @UseGuards(JwtAuthGuard)
  async becomeHost(@CurrentUser('id') userId: string) {
    return this.authService.becomeHost(userId);
  }

  @Public()
  @Post('host-onboard')
  async onboardHost(@Body() dto: HostOnboardDto) {
    return this.authService.onboardHost(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return this.authService.logout();
  }
}
