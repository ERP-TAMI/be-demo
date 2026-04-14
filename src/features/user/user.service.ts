import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Tìm user theo email — phục vụ login
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Tìm user theo id — phục vụ JWT Strategy
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Cập nhật thông tin sau khi login thành công
   */
  async updateLoginSuccess(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      loginFailedCount: 0,
      lockoutUntil: undefined,
    });
  }

  /**
   * Tăng số lần login sai; nếu đạt ngưỡng → set lockout
   */
  async incrementLoginFail(
    userId: string,
    currentCount: number,
  ): Promise<void> {
    const newCount = currentCount + 1;

    if (newCount >= 5) {
      const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
      await this.userRepository.update(userId, {
        loginFailedCount: 0,
        lockoutUntil,
      });
    } else {
      await this.userRepository.update(userId, {
        loginFailedCount: newCount,
      });
    }
  }

  /**
   * Cập nhật password hash và tắt cờ must_change_password
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    });
  }

  // ── Forgot Password OTP helpers ──────────────────────────

  /**
   * Lưu OTP reset vào DB với TTL 10 phút
   */
  async saveResetOtp(userId: string, otp: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await this.userRepository.update(userId, {
      resetOtp: otp,
      resetOtpExpiresAt: expiresAt,
    });
  }

  /**
   * Tìm user theo email VÀ OTP còn hạn.
   * Trả null nếu không tìm thấy, OTP sai, hoặc OTP đã hết hạn.
   */
  async findByEmailWithValidOtp(
    email: string,
    otp: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    if (!user.resetOtp || user.resetOtp !== otp) return null;
    if (!user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date())
      return null;
    return user;
  }

  /**
   * Xóa OTP sau khi đã dùng (hoặc thất bại nhiều lần)
   */
  async clearResetOtp(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      resetOtp: null,
      resetOtpExpiresAt: null,
    });
  }
}
