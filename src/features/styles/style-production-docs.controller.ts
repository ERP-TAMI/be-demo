import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
  Res,
  Header,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { StyleProductionDocsService } from './style-production-docs.service.js';
import { ProductionDocStatus } from './entities/style-production-doc.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UpdateStyleProductionDocDto } from './dto/update-style-production-doc.dto.js';
import { CreateStyleProductionDocDto } from './dto/create-style-production-doc.dto.js';
import { CopyProductionDocDto } from './dto/copy-production-doc.dto.js';
import { ResyncProductionDocDto } from './dto/resync-production-doc.dto.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@UseGuards(JwtAuthGuard)
@Controller('styles/:styleId/production-docs')
export class StyleProductionDocsController {
  constructor(
    private readonly service: StyleProductionDocsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  findAll(@Param('styleId', ParseUUIDPipe) styleId: string) {
    return this.service.findByStyleId(styleId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('RD', 'NVKH', 'TPKH')
  create(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body() body: CreateStyleProductionDocDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.createWithAutoFill(styleId, {
      ...body,
      createdBy: req.user?.email ?? 'system',
    });
  }

  @Patch(':docId')
  update(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() body: UpdateStyleProductionDocDto,
  ) {
    return this.service.update(docId, body);
  }

  @Patch(':docId/status')
  updateStatus(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body('status') status: ProductionDocStatus,
  ) {
    return this.service.updateStatus(docId, status);
  }

  @Delete(':docId')
  remove(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    return this.service.remove(docId);
  }

  @Patch(':docId/resync')
  @UseGuards(RolesGuard)
  @Roles('RD', 'NVKH', 'TPKH')
  resync(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() body: ResyncProductionDocDto,
  ) {
    return this.service.resync(docId, {
      sections: body.sections,
      confirmOverwrite: body.confirmOverwrite,
    });
  }

  @Post(':docId/copy')
  @UseGuards(RolesGuard)
  @Roles('RD', 'NVKH', 'TPKH')
  copy(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() body: CopyProductionDocDto,
    @Request() req: { user?: { role: string } },
  ) {
    return this.service.copyToStyle(
      docId,
      body.targetStyleId,
      body.mode,
      body.excludeSections,
      req.user?.role,
      body.confirmOverwrite,
    );
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
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file ảnh');

    // file.buffer is available with memory storage; for disk storage, read from path
    const buffer =
      file.buffer ??
      (await import('fs').then((fs) => fs.promises.readFile(file.path)));

    const result = await this.uploadsService.uploadFile(
      'production-docs',
      file.originalname,
      buffer,
      file.mimetype,
    );

    // Clean up temp file if it was saved to disk
    if (file.path) {
      import('fs').then((fs) => fs.promises.unlink(file.path).catch(() => {}));
    }

    return { url: result.fileUrl };
  }

  @Get('export')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="tai-lieu-sx.xlsx"')
  async exportExcel(
    @Param('styleId') styleId: string,
  ): Promise<StreamableFile> {
    const buffer = await this.service.exportExcel(styleId);
    return new StreamableFile(buffer);
  }

  @Get('test-debug')
  testDebug(@Param('styleId') styleId: string) {
    return { received: styleId, path: 'test-debug' };
  }
}
