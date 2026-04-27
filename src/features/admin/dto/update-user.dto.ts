import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role không hợp lệ' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;
}
