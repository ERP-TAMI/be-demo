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
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ProductionDocsService } from './production-docs.service.js';
import { SaveProductionDocDto } from './dto/save-production-doc.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UserRole } from '../user/entities/user.entity';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FINAL_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const PO_LINE_EDITOR_ROLES = [UserRole.RD, UserRole.NVKH, UserRole.TPKH];
const ALLOWED_FINAL_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
];

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
  @UseGuards(RolesGuard)
  @Roles(...PO_LINE_EDITOR_ROLES)
  async save(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: SaveProductionDocDto,
  ) {
    return this.service.upsert(lineId, dto);
  }

  @Post('sync-from-style')
  @UseGuards(RolesGuard)
  @Roles(...PO_LINE_EDITOR_ROLES)
  async syncFromStyle(@Param('lineId', ParseUUIDPipe) lineId: string) {
    return this.service.syncFromStyle(lineId);
  }

  @Post('resync-from-bom')
  @UseGuards(RolesGuard)
  @Roles(...PO_LINE_EDITOR_ROLES)
  async resyncFromBom(@Param('lineId', ParseUUIDPipe) lineId: string) {
    return this.service.resyncSection12FromBom(lineId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận PNG, JPG hoặc WebP'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Vui lòng chọn file ảnh');
    const result = await this.uploadsService.uploadFile(
      'production-docs',
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    return { url: result.fileUrl };
  }

  @Post('upload-final')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FINAL_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx');
        if (!isXlsx || !ALLOWED_FINAL_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Chỉ chấp nhận file XLSX'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFinal(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ finalDocUrl: string; finalDocName: string }> {
    if (!file) throw new BadRequestException('Vui lòng chọn file XLSX');
    return this.service.uploadFinal(lineId, file);
  }

  @Get('final-download')
  async getFinalDownload(@Param('lineId', ParseUUIDPipe) lineId: string) {
    return this.service.getFinalDownload(lineId);
  }

  @Get('export')
  async exportExcel(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportExcel(lineId);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tai-lieu-sx-${lineId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
