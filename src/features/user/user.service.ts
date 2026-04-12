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
  async incrementLoginFail(userId: string, currentCount: number): Promise<void> {
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
}
