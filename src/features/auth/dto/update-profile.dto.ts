import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Họ tên không được quá 200 ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại không được quá 20 ký tự' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'URL ảnh không hợp lệ' })
  avatarUrl?: string;
}
