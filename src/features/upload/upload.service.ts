import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';

const CLOUDINARY_REQUIRED_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

type CloudinaryConfigKey = (typeof CLOUDINARY_REQUIRED_KEYS)[number];
type CloudinaryConfigMap = Record<CloudinaryConfigKey, string>;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly cloudinaryConfig: CloudinaryConfigMap;

  constructor(private readonly configService: ConfigService) {
    this.cloudinaryConfig = {
      CLOUDINARY_CLOUD_NAME:
        this.configService.get<string>('CLOUDINARY_CLOUD_NAME')?.trim() ?? '',
      CLOUDINARY_API_KEY:
        this.configService.get<string>('CLOUDINARY_API_KEY')?.trim() ?? '',
      CLOUDINARY_API_SECRET:
        this.configService.get<string>('CLOUDINARY_API_SECRET')?.trim() ?? '',
    };

    cloudinary.config({
      cloud_name: this.cloudinaryConfig.CLOUDINARY_CLOUD_NAME || undefined,
      api_key: this.cloudinaryConfig.CLOUDINARY_API_KEY || undefined,
      api_secret: this.cloudinaryConfig.CLOUDINARY_API_SECRET || undefined,
    });
  }

  private assertCloudinaryConfigured(): void {
    const missingKeys = CLOUDINARY_REQUIRED_KEYS.filter(
      (key) => !this.cloudinaryConfig[key],
    );

    if (missingKeys.length === 0) {
      return;
    }

    this.logger.error(
      `Missing Cloudinary configuration keys: ${missingKeys.join(', ')}`,
    );

    throw new InternalServerErrorException(
      'Cloudinary chưa được cấu hình đầy đủ. Vui lòng kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
    );
  }

  /**
   * Upload buffer lên Cloudinary, lưu vào folder erp-may/avatars/
   * Trả về secure_url để lưu vào DB
   */
  async uploadAvatar(buffer: Buffer, originalName: string): Promise<string> {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new BadRequestException(
        'File ảnh không hợp lệ hoặc không đọc được dữ liệu.',
      );
    }

    this.assertCloudinaryConfigured();

    return new Promise((resolve, reject) => {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'erp-may/avatars',
            resource_type: 'image',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error || !result?.secure_url) {
              const reason =
                error?.message ??
                'Không nhận được secure_url từ Cloudinary.';

              this.logger.error(
                `Cloudinary avatar upload failed for ${originalName}: ${reason}`,
              );

              return reject(
                new InternalServerErrorException(
                  `Tải ảnh lên Cloudinary thất bại: ${reason}`,
                ),
              );
            }

            resolve(result.secure_url);
          },
        );

        Readable.from(buffer).pipe(uploadStream);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Lỗi không xác định.';

        this.logger.error(
          `Cloudinary avatar upload crashed for ${originalName}: ${reason}`,
        );

        reject(
          new InternalServerErrorException(
            `Tải ảnh lên Cloudinary thất bại: ${reason}`,
          ),
        );
      }
    });
  }
}
