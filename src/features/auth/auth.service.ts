import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { User, UserStatus } from '../user/entities/user.entity.js';
import { MailService } from '../../mail/mail.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    mustChangePassword: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * API POST /auth/login
   * Logic theo thứ tự SRS FR-M01-001 ~ FR-M01-008
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    // 1. Tìm user theo email
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 2. Kiểm tra lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMs = user.lockoutUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ForbiddenException(
        `Tài khoản đã bị tạm khóa. Vui lòng thử lại sau ${remainingMin} phút.`,
      );
    }

    // 3. So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      // Tăng login fail count
      await this.userService.incrementLoginFail(user.id, user.loginFailedCount);

      // Nếu đây là lần thứ 5 → vừa bị lock
      if (user.loginFailedCount + 1 >= 5) {
        throw new ForbiddenException(
          'Bạn đã nhập sai mật khẩu 5 lần. Tài khoản bị tạm khóa 15 phút.',
        );
      }

      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 4. Kiểm tra trạng thái tài khoản
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(
        'Tài khoản đã bị vô hiệu hóa, liên hệ IT Admin.',
      );
    }

    // 5. Login thành công → reset fail count, cập nhật last_login_at
    await this.userService.updateLoginSuccess(user.id);

    // 6. Ký JWT
    return this.signTokenAndBuildResponse(user, user.mustChangePassword);
  }

  /**
   * API PATCH /auth/change-password
   * Protected bởi JwtAuthGuard — user đã đăng nhập
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<LoginResponse> {
    // Validate mật khẩu mới khớp
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Tìm user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    // Cập nhật DB
    await this.userService.updatePassword(userId, newHash);

    return this.signTokenAndBuildResponse(user, false);
  }

  /**
   * API POST /auth/forgot-password  — Public
   * Gửi OTP 6 số về email (nếu tồn tại)
   * Luôn trả 200 dù email có tồn tại hay không (bảo mật — không lộ thông tin)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const SAFE_RESPONSE = {
      message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.',
    };

    const user = await this.userService.findByEmail(dto.email);
    if (!user || user.status === UserStatus.INACTIVE) {
      // Không throw — trả response giống như thành công
      return SAFE_RESPONSE;
    }

    // Tạo OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu vào DB (TTL 10 phút)
    await this.userService.saveResetOtp(user.id, otp);

    // Gửi email (fire-and-forget — lỗi email không block response)
    this.mailService
      .sendForgotPasswordEmail({ to: user.email, fullName: user.fullName, otp })
      .catch(() => {});

    return SAFE_RESPONSE;
  }

  /**
   * API POST /auth/verify-otp — Public
   * Chỉ kiểm tra OTP có hợp lệ không, không thay đổi mật khẩu
   * Dùng cho bước 2a ở FE: user nhập OTP trước, FE verify, rồi mới cho nhập MK mới
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ valid: boolean }> {
    const user = await this.userService.findByEmailWithValidOtp(
      dto.email,
      dto.otp,
    );
    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    return { valid: true };
  }

  /**
   * API POST /auth/reset-password — Public
   * Xác thực OTP và đặt lại mật khẩu mới
   */
  async resetPassword(dto: ResetPasswordDto): Promise<LoginResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Tìm user với OTP hợp lệ
    const user = await this.userService.findByEmailWithValidOtp(
      dto.email,
      dto.otp,
    );
    if (!user) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    // Cập nhật mật khẩu + tắt must_change_password
    await this.userService.updatePassword(user.id, newHash);

    // Xóa OTP đã dùng
    await this.userService.clearResetOtp(user.id);

    return this.signTokenAndBuildResponse(user, false);
  }

  /**
   * Validate JWT payload — gọi từ JwtStrategy
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException();
    }
    return user;
  }

  // ── Private helper ─────────────────────────────────────────
  private signTokenAndBuildResponse(
    user: User,
    mustChangePassword: boolean,
  ): LoginResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword,
      },
    };
  }
}
