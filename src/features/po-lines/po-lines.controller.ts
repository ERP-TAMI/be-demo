import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PoLinesService } from './po-lines.service.js';
import { LineStatus, PoLine } from './entities/po-line.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { LineAs3bStep } from './entities/line-as3b-step.entity';
import { LineSample } from './entities/line-sample.entity';
import { UserRole } from '../user/entities/user.entity';
import { ColorCardService } from './color-card.service.js';

const MAX_COLOR_CARD_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_COLOR_CARD_TYPES = ['image/jpeg', 'image/png'];

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders/:poId/lines')
export class PoLinesController {
  constructor(
    private readonly service: PoLinesService,
    private readonly colorCardService: ColorCardService,
  ) {}

  @Get()
  findAll(@Param('poId', ParseUUIDPipe) poId: string) {
    return this.service.findByPo(poId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.NVKH, UserRole.TPKH)
  create(
    @Param('poId', ParseUUIDPipe) poId: string,
    @Body() body: Partial<PoLine>,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.create(poId, body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<PoLine>,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.update(id, body, req.user?.email ?? 'system');
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: LineStatus,
    @Body('reason') reason: string | undefined,
    @Request() req: { user?: { email?: string; role?: UserRole } },
  ) {
    return this.service.updateStatus(id, status, {
      actor: req.user?.email ?? 'system',
      actorRole: req.user?.role,
      reason,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // ─── Colors ──────────────────────────────────────────────────────────────────

  @Post(':id/colors')
  addColor(
    @Param('id', ParseUUIDPipe) lineId: string,
    @Body('colorName') colorName: string,
  ) {
    return this.service.addColor(lineId, colorName);
  }

  @Delete('colors/:colorId')
  removeColor(@Param('colorId', ParseUUIDPipe) colorId: string) {
    return this.service.removeColor(colorId);
  }

  @Post('colors/:colorId/sizes')
  addSize(
    @Param('colorId', ParseUUIDPipe) colorId: string,
    @Body() body: { sizeLabel: string; quantity: number },
  ) {
    return this.service.addSize(colorId, body.sizeLabel, body.quantity);
  }

  // ─── Line Files ─────────────────────────────────────────────────────────────

  @Post(':id/files')
  addFile(
    @Param('id', ParseUUIDPipe) lineId: string,
    @Body()
    body: {
      fileKey: string;
      originalName: string;
      label?: string;
      version?: number;
      fileGroupId?: string;
    },
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.addLineFile(lineId, body, req.user?.email ?? 'system');
  }

  @Delete('files/:fileId')
  removeFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.removeLineFile(fileId, req.user?.email ?? 'system');
  }

  // ─── AS3B Steps ──────────────────────────────────────────────────────────────

  @Get(':id/as3b-steps')
  findSteps(@Param('id', ParseUUIDPipe) lineId: string) {
    return this.service.findAs3bSteps(lineId);
  }

  @Post(':id/as3b-steps')
  addStep(
    @Param('id', ParseUUIDPipe) lineId: string,
    @Body() body: Partial<LineAs3bStep>,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.addStep(lineId, body, req.user?.email ?? 'system');
  }

  @Delete('as3b-steps/:stepId')
  removeStep(
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.removeStep(stepId, req.user?.email ?? 'system');
  }

  @Put(':id/as3b-steps/sync')
  syncSteps(
    @Param('id', ParseUUIDPipe) lineId: string,
    @Body('steps') steps: Partial<LineAs3bStep>[],
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.syncAs3bSteps(
      lineId,
      steps ?? [],
      req.user?.email ?? 'system',
    );
  }

  // ─── Samples ────────────────────────────────────────────────────────────────

  @Get(':id/samples')
  findSamples(@Param('id', ParseUUIDPipe) lineId: string) {
    return this.service.findSamples(lineId);
  }

  @Post(':id/samples')
  addSample(
    @Param('id', ParseUUIDPipe) lineId: string,
    @Body() body: Partial<LineSample>,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.addSample(lineId, body, req.user?.email ?? 'system');
  }

  @Patch('samples/:sampleId')
  updateSample(
    @Param('sampleId', ParseUUIDPipe) sampleId: string,
    @Body() body: Partial<LineSample>,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.updateSample(
      sampleId,
      body,
      req.user?.email ?? 'system',
    );
  }

  // ─── File Mappings ───────────────────────────────────────────────────────────

  @Post('assign-file')
  assignFile(
    @Param('poId', ParseUUIDPipe) poId: string,
    @Body() body: { fileId: string; lineIds: string[] },
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.assignFileToLines(
      poId,
      body.fileId,
      body.lineIds,
      req.user?.email ?? 'system',
    );
  }

  // ─── Color Card (Bảng màu) ─────────────────────────────────────────────────

  /**
   * GET /api/v1/purchase-orders/:poId/lines/colors/:colorId/color-card
   * Lấy thông tin bảng màu hiện tại + presigned URL để preview.
   * Trả về null nếu chưa có.
   */
  @Get('colors/:colorId/color-card')
  getColorCard(
    @Param('poId', ParseUUIDPipe) poId: string,
    @Param('colorId', ParseUUIDPipe) colorId: string,
  ) {
    return this.colorCardService.getColorCard(poId, colorId);
  }

  /**
   * POST /api/v1/purchase-orders/:poId/lines/colors/:colorId/color-card
   * Upload bảng màu mới (insert) hoặc thay thế bảng màu cũ (update đè).
   * Body: multipart/form-data — field "file" (JPG/PNG, tối đa 20MB) + field "reason" (string)
   */
  @Post('colors/:colorId/color-card')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_COLOR_CARD_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_COLOR_CARD_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Bảng màu chỉ chấp nhận file JPG hoặc PNG'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadColorCard(
    @Param('poId', ParseUUIDPipe) poId: string,
    @Param('colorId', ParseUUIDPipe) colorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('reason') reason: string | undefined,
    @Request() req: { user?: { id?: string; email?: string; role?: UserRole } },
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh bảng màu');
    }
    if (!req.user?.role) {
      throw new ForbiddenException('Khong xac dinh duoc vai tro nguoi dung');
    }
    return this.colorCardService.upsertColorCard({
      poId,
      colorId,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      actorId: req.user?.id ?? req.user?.email ?? 'system',
      actorRole: req.user.role,
      reason,
    });
  }

  // ─── Lock / Unlock (chỉ TPKH) ────────────────────────────────────────────

  /**
   * POST /api/v1/purchase-orders/:poId/lines/:id/lock
   * Chốt SP Final — chỉ TPKH.
   * Tự động tạo BOM Draft V1 rỗng sau khi khoá.
   */
  @Post(':id/lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TPKH)
  lockLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.lockLine(id, req.user?.email ?? 'system');
  }

  /**
   * POST /api/v1/purchase-orders/:poId/lines/:id/unlock
   * Mở khoá SP — chỉ TPKH.
   */
  @Post(':id/unlock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TPKH)
  unlockLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.unlockLine(id, req.user?.email ?? 'system');
  }

  /**
   * GET /api/v1/purchase-orders/:poId/lines/:id/versions
   * Xem lịch sử phiên bản của PoLine.
   */
  @Get(':id/versions')
  getVersionHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findVersionHistory(id);
  }
}
