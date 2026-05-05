import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocFoldersService } from './doc-folders.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('doc-folders')
export class DocFoldersController {
  constructor(
    private readonly service: DocFoldersService,
    private readonly uploadsService: UploadsService,
  ) {}

  /** GET /api/v1/doc-folders?search=xxx */
  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  /** GET /api/v1/doc-folders/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** POST /api/v1/doc-folders */
  @Post()
  create(
    @Body() body: { name: string; description?: string },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create({
      name: body.name,
      description: body.description,
      createdBy: req.user?.email ?? 'system',
    });
  }

  /** DELETE /api/v1/doc-folders/:id */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  /** POST /api/v1/doc-folders/:id/files */
  @Post(':id/files')
  addFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name: string; type: string; size?: string; url?: string },
  ) {
    return this.service.addFile(id, body);
  }

  /** POST /api/v1/doc-folders/:id/files/upload  (multipart: field "file") */
  @Post(':id/files/upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Không có file được gửi lên');

    const result = await this.uploadsService.uploadFile(
      'doc-files',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'file';
    let type = 'file';
    if (ext === 'pdf') type = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
      type = 'image';
    else if (['xlsx', 'xls'].includes(ext)) type = 'xlsx';
    else if (['doc', 'docx'].includes(ext)) type = 'docx';

    return this.service.addFile(id, {
      name: file.originalname,
      type,
      size: `${result.sizeMb.toFixed(1)} MB`,
      url: result.fileUrl,
      fileKey: result.fileKey,
    });
  }

  /** DELETE /api/v1/doc-folders/:id/files/:fileId */
  @Delete(':id/files/:fileId')
  async removeFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.service.removeFile(id, fileId, this.uploadsService);
  }
}
