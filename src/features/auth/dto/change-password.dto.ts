import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' })
  @Matches(/[0-9]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ số' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}
