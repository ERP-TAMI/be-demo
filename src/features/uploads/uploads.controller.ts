import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /api/v1/uploads?folder=po-files
   * Multipart form-data field: "file"
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'misc',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadsService.uploadFile(
      folder,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return {
      fileKey: result.fileKey,
      fileUrl: result.fileUrl,
      fileName: result.fileName,
      sizeMb: result.sizeMb,
    };
  }
}
