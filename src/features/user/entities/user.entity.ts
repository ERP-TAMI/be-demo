import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
} from 'typeorm';

export enum UserRole {
  TPKH = 'TPKH',
  NVKH = 'NVKH',
  RD = 'RD',
  KT = 'KT',
  SA = 'SA',
  IT = 'IT',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 200, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({
    type: 'boolean',
    default: true,
    name: 'must_change_password',
  })
  mustChangePassword: boolean;

  @Column({
    type: 'int',
    default: 0,
    name: 'login_failed_count',
  })
  loginFailedCount: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'lockout_until',
  })
  lockoutUntil: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'last_login_at',
  })
  lastLoginAt: Date;

  // ── Forgot Password OTP ──────────────────────────────────
  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
    name: 'reset_otp',
  })
  resetOtp: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'reset_otp_expires_at',
  })
  resetOtpExpiresAt: Date | null;

  // ─────────────────────────────────────────────────────────
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
