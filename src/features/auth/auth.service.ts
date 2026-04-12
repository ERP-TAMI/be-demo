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
import { User, UserStatus } from '../user/entities/user.entity.js';

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
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
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
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = this.jwtService.sign(payload);

    // 7. Trả về response
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  /**
   * API PATCH /auth/change-password
   * Protected bởi JwtAuthGuard — user đã đăng nhập
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<LoginResponse> {
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

    // Ký JWT mới (với mustChangePassword = false)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: false,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: false,
      },
    };
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
}
