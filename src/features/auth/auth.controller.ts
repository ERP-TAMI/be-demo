import { Controller, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Public — không cần token
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * PATCH /api/v1/auth/change-password
   * Protected — cần Bearer token
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Public — gửi OTP về email
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * POST /api/v1/auth/verify-otp
   * Public — kiểm tra OTP hợp lệ (không đổi mk)
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Public — xác thực OTP + đặt mật khẩu mới, trả JWT
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
