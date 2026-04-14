import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // TLS
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Gửi email chào mừng khi IT Admin tạo tài khoản mới
   */
  async sendWelcomeEmail(options: {
    to: string;
    fullName: string;
    tempPassword: string;
  }): Promise<void> {
    const { to, fullName, tempPassword } = options;
    const loginUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:5173',
    );

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2563eb;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">ERP May Tấn Minh</h1>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px;">Hệ thống quản lý sản xuất</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Chào mừng bạn, ${fullName}!</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Tài khoản của bạn đã được tạo trên hệ thống ERP. Vui lòng đăng nhập và đổi mật khẩu ngay.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Thông tin đăng nhập</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;width:40%;">Email:</td>
            <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${to}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;">Mật khẩu tạm:</td>
            <td style="padding:6px 0;">
              <code style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;font-size:15px;font-weight:700;">${tempPassword}</code>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#713f12;">
          ⚠️ <strong>Bắt buộc:</strong> Bạn sẽ được yêu cầu đổi mật khẩu ngay khi đăng nhập lần đầu.
        </p>
      </div>

      <a href="${loginUrl}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Đăng nhập ngay →
      </a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Email này được gửi tự động từ hệ thống ERP. Vui lòng không trả lời email này.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        replyTo: this.configService.get<string>('MAIL_REPLY_TO'),
        to,
        subject: '[ERP May] Tài khoản của bạn đã được tạo',
        html,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${to}`,
        (error as Error).message,
      );
      // Không throw — lỗi email không nên chặn việc tạo user
    }
  }

  /**
   * Gửi email khi IT Admin reset mật khẩu
   */
  async sendResetPasswordEmail(options: {
    to: string;
    fullName: string;
    newPassword: string;
  }): Promise<void> {
    const { to, fullName, newPassword } = options;
    const loginUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:5173',
    );

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#dc2626;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">ERP May Tấn Minh</h1>
      <p style="margin:4px 0 0;color:#fecaca;font-size:14px;">Thông báo bảo mật</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Mật khẩu của bạn đã được đặt lại</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Xin chào <strong>${fullName}</strong>, mật khẩu tài khoản của bạn đã được đặt lại bởi IT Admin. Vui lòng đăng nhập với mật khẩu tạm dưới đây.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;">Mật khẩu tạm mới</p>
        <code style="background:#fee2e2;color:#991b1b;padding:8px 16px;border-radius:4px;font-size:18px;font-weight:700;display:block;text-align:center;">${newPassword}</code>
      </div>

      <div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#713f12;">
          ⚠️ Bạn sẽ được yêu cầu đổi mật khẩu ngay sau khi đăng nhập. Nếu không phải bạn yêu cầu, hãy liên hệ IT Admin ngay lập tức.
        </p>
      </div>

      <a href="${loginUrl}/login" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Đăng nhập ngay →
      </a>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Email bảo mật — ERP May Tấn Minh</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        replyTo: this.configService.get<string>('MAIL_REPLY_TO'),
        to,
        subject: '[ERP May] Mật khẩu tài khoản đã được đặt lại',
        html,
      });
      this.logger.log(`Reset password email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset email to ${to}`,
        (error as Error).message,
      );
    }
  }

  /**
   * Gửi OTP khi user tự yêu cầu quên mật khẩu
   */
  async sendForgotPasswordEmail(options: {
    to: string;
    fullName: string;
    otp: string;
  }): Promise<void> {
    const { to, fullName, otp } = options;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2563eb;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">ERP May Tấn Minh</h1>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px;">Đặt lại mật khẩu</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Xin chào, ${fullName}!</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${to}</strong>.
        Sử dụng mã OTP bên dưới để tiếp tục.
      </p>

      <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Mã xác nhận OTP</p>
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:monospace;">${otp}</div>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
          ⏱ Mã có hiệu lực trong <strong>10 phút</strong>
        </p>
      </div>

      <div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#713f12;">
          🔒 Nếu bạn <strong>không</strong> yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
          Mật khẩu hiện tại của bạn sẽ không bị thay đổi.
        </p>
      </div>
    </div>
    <div style="border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Email này được gửi tự động từ hệ thống ERP. Vui lòng không trả lời email này.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        replyTo: this.configService.get<string>('MAIL_REPLY_TO'),
        to,
        subject: '[ERP May] Mã OTP đặt lại mật khẩu',
        html,
      });
      this.logger.log(`Forgot-password OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${to}`,
        (error as Error).message,
      );
    }
  }
}
