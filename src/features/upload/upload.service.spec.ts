import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Writable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { UploadService } from './upload.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('UploadService', () => {
  let service: UploadService;
  let configService: jest.Mocked<ConfigService>;
  let mockCloudinaryConfig: jest.Mock;
  let mockUploadStream: jest.Mock;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockCloudinaryConfig = cloudinary.config as jest.Mock;
    mockUploadStream = cloudinary.uploader.upload_stream as jest.Mock;

    jest.clearAllMocks();
  });

  function createWritableUploadStream() {
    return new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
  }

  it('rejects with a clear error when Cloudinary config is missing', async () => {
    configService.get.mockReturnValue(undefined);
    service = new UploadService(configService);
    const uploadPromise = service.uploadAvatar(Buffer.from('avatar'), 'avatar.png');

    await expect(uploadPromise).rejects.toThrow(InternalServerErrorException);

    await expect(uploadPromise).rejects.toThrow(
      'Cloudinary chưa được cấu hình đầy đủ. Vui lòng kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
    );

    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  it('rejects invalid avatar buffers before calling Cloudinary', async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'demo-cloud',
        CLOUDINARY_API_KEY: 'demo-key',
        CLOUDINARY_API_SECRET: 'demo-secret',
      };

      return values[key];
    });
    service = new UploadService(configService);
    const uploadPromise = service.uploadAvatar(
      undefined as unknown as Buffer,
      'avatar.png',
    );

    await expect(uploadPromise).rejects.toThrow(BadRequestException);

    await expect(uploadPromise).rejects.toThrow(
      'File ảnh không hợp lệ hoặc không đọc được dữ liệu.',
    );

    expect(mockUploadStream).not.toHaveBeenCalled();
  });

  it('wraps Cloudinary upload failures with a readable message', async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'demo-cloud',
        CLOUDINARY_API_KEY: 'demo-key',
        CLOUDINARY_API_SECRET: 'demo-secret',
      };

      return values[key];
    });
    service = new UploadService(configService);

    mockUploadStream.mockImplementation(
      (
        _options: unknown,
        callback: (
          error?: { message?: string },
          result?: { secure_url?: string },
        ) => void,
      ) => {
        process.nextTick(() => callback({ message: 'Invalid API key' }));
        return createWritableUploadStream();
      },
    );
    const uploadPromise = service.uploadAvatar(Buffer.from('avatar'), 'avatar.png');

    await expect(uploadPromise).rejects.toThrow(InternalServerErrorException);

    await expect(uploadPromise).rejects.toThrow(
      'Tải ảnh lên Cloudinary thất bại: Invalid API key',
    );
  });

  it('returns the secure Cloudinary URL when upload succeeds', async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'demo-cloud',
        CLOUDINARY_API_KEY: 'demo-key',
        CLOUDINARY_API_SECRET: 'demo-secret',
      };

      return values[key];
    });
    service = new UploadService(configService);

    mockUploadStream.mockImplementation(
      (
        _options: unknown,
        callback: (
          error?: { message?: string },
          result?: { secure_url?: string },
        ) => void,
      ) => {
        process.nextTick(() =>
          callback(undefined, {
            secure_url: 'https://res.cloudinary.com/demo/avatar.png',
          }),
        );
        return createWritableUploadStream();
      },
    );

    await expect(
      service.uploadAvatar(Buffer.from('avatar'), 'avatar.png'),
    ).resolves.toBe('https://res.cloudinary.com/demo/avatar.png');
  });
});
