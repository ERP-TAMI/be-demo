import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';

// IT Admin chỉ được gán các role này (không gán SA)
export const ASSIGNABLE_ROLES_BY_IT = [
  UserRole.TPKH,
  UserRole.NVKH,
  UserRole.RD,
  UserRole.KT,
  UserRole.IT,
];

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' })
  @Matches(/[0-9]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ số' })
  password: string;

  @IsEnum(UserRole, { message: 'Role không hợp lệ' })
  @IsNotEmpty({ message: 'Role không được để trống' })
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}
