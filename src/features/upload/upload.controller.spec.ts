import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
jest.mock(
  '../auth/guards/jwt-auth.guard.js',
  () => ({
    JwtAuthGuard: class JwtAuthGuard {},
  }),
  { virtual: true },
);

jest.mock(
  './upload.service.js',
  () => ({
    UploadService: class UploadService {},
  }),
  { virtual: true },
);

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<UploadService>;

  beforeEach(() => {
    uploadService = {
      uploadAvatar: jest.fn(),
    } as unknown as jest.Mocked<UploadService>;

    controller = new UploadController(uploadService);
  });

  it('throws when no avatar file is provided', async () => {
    const uploadPromise = controller.uploadAvatar(undefined as never);

    await expect(uploadPromise).rejects.toThrow(BadRequestException);
    await expect(uploadPromise).rejects.toThrow('Vui lòng chọn file ảnh');
  });

  it('returns the uploaded avatar url on success', async () => {
    uploadService.uploadAvatar.mockResolvedValue(
      'https://res.cloudinary.com/demo/avatar.png',
    );

    await expect(
      controller.uploadAvatar({
        buffer: Buffer.from('avatar'),
        originalname: 'avatar.png',
      } as Express.Multer.File),
    ).resolves.toEqual({
      url: 'https://res.cloudinary.com/demo/avatar.png',
    });
  });

  it('rethrows known HttpExceptions from the upload service', async () => {
    uploadService.uploadAvatar.mockRejectedValue(
      new InternalServerErrorException('Cloudinary chưa được cấu hình đầy đủ.'),
    );
    const uploadPromise = controller.uploadAvatar({
      buffer: Buffer.from('avatar'),
      originalname: 'avatar.png',
    } as Express.Multer.File);

    await expect(uploadPromise).rejects.toThrow(HttpException);
    await expect(uploadPromise).rejects.toThrow(
      'Cloudinary chưa được cấu hình đầy đủ.',
    );
  });

  it('maps unknown upload errors to a readable InternalServerErrorException', async () => {
    uploadService.uploadAvatar.mockRejectedValue(new Error('socket hang up'));
    const uploadPromise = controller.uploadAvatar({
      buffer: Buffer.from('avatar'),
      originalname: 'avatar.png',
    } as Express.Multer.File);

    await expect(uploadPromise).rejects.toThrow(InternalServerErrorException);
    await expect(uploadPromise).rejects.toThrow(
      'Không thể tải ảnh đại diện lên lúc này.',
    );
  });
});
