import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../user/entities/user.entity.js';
import { MailService } from '../../mail/mail.service.js';
import { CreateUserDto, ASSIGNABLE_ROLES_BY_IT } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

export interface UserListQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Dữ liệu trả về — không expose passwordHash
type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  // ─────────────────────────────── LIST ───────────────────────────────

  async listUsers(query: UserListQuery): Promise<SafeUser[]> {
    const where: any = {};

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    let users: User[];

    if (query.search) {
      // Search theo fullName hoặc email
      users = await this.userRepository.find({
        where: [
          { ...where, fullName: ILike(`%${query.search}%`) },
          { ...where, email: ILike(`%${query.search}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      users = await this.userRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
    }

    return users.map(({ passwordHash: _, ...safe }) => safe as SafeUser);
  }

  // ─────────────────────────────── CREATE ───────────────────────────────

  async createUser(dto: CreateUserDto, callerRole: string): Promise<SafeUser> {
    // Rule: IT không được tạo SA
    if (dto.role === UserRole.SA && callerRole !== UserRole.SA) {
      throw new ForbiddenException('Không được phép gán quyền Super Admin');
    }
    if (!ASSIGNABLE_ROLES_BY_IT.includes(dto.role) && callerRole === UserRole.IT) {
      throw new ForbiddenException('Không được phép gán quyền này');
    }

    // Kiểm tra email unique
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email này đã được đăng ký trong hệ thống');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      phone: dto.phone,
      status: UserStatus.ACTIVE,
      mustChangePassword: true, // luôn bắt buộc đổi pass lần đầu
    });

    const saved = await this.userRepository.save(user);

    // Gửi welcome email (async, không block)
    void this.mailService.sendWelcomeEmail({
      to: dto.email,
      fullName: dto.fullName,
      tempPassword: dto.password,
    });

    const { passwordHash: _, ...safe } = saved;
    return safe as SafeUser;
  }

  // ─────────────────────────────── UPDATE ───────────────────────────────

  async updateUser(
    targetId: string,
    dto: UpdateUserDto,
    callerId: string,
    callerRole: string,
  ): Promise<SafeUser> {
    const user = await this.findOrThrow(targetId);

    // Rule: IT không tự đổi role của mình thành SA
    if (dto.role === UserRole.SA && callerRole !== UserRole.SA) {
      throw new ForbiddenException('Không được phép gán quyền Super Admin');
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...safe } = saved;
    return safe as SafeUser;
  }

  // ─────────────────────────────── TOGGLE STATUS ───────────────────────────────

  async toggleStatus(targetId: string, callerId: string): Promise<SafeUser> {
    // Rule: không tự vô hiệu hóa chính mình
    if (targetId === callerId) {
      throw new ForbiddenException('Không thể vô hiệu hóa tài khoản của chính mình');
    }

    const user = await this.findOrThrow(targetId);

    user.status =
      user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...safe } = saved;
    return safe as SafeUser;
  }

  // ─────────────────────────────── RESET PASSWORD ───────────────────────────────

  async resetPassword(
    targetId: string,
    dto: ResetPasswordDto,
    callerId: string,
  ): Promise<{ message: string }> {
    const user = await this.findOrThrow(targetId);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.update(targetId, {
      passwordHash,
      mustChangePassword: true,
      loginFailedCount: 0,
      lockoutUntil: undefined,
    });

    // Gửi email thông báo
    void this.mailService.sendResetPasswordEmail({
      to: user.email,
      fullName: user.fullName,
      newPassword: dto.newPassword,
    });

    return { message: `Đã đặt lại mật khẩu và gửi email đến ${user.email}` };
  }

  // ─────────────────────────────── HELPER ───────────────────────────────

  private async findOrThrow(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }
}
