import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Res,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProductionDocsService } from './production-docs.service.js';
import { SaveProductionDocDto } from './dto/save-production-doc.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@UseGuards(JwtAuthGuard)
@Controller('po-lines/:lineId/production-doc')
export class ProductionDocsController {
  constructor(
    private readonly service: ProductionDocsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  async findOne(@Param('lineId', ParseUUIDPipe) lineId: string) {
    return this.service.findByLineId(lineId);
  }

  @Post()
  async save(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: SaveProductionDocDto,
  ) {
    return this.service.upsert(lineId, dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Chỉ chấp nhận PNG, JPG hoặc WebP'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Vui lòng chọn file ảnh');
    const result = await this.uploadsService.uploadFile('production-docs', file.originalname, file.buffer, file.mimetype);
    return { url: result.fileUrl };
  }

  @Get('export')
  async exportExcel(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportExcel(lineId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tai-lieu-sx-${lineId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
