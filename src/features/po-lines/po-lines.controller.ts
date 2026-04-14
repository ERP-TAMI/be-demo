import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PoLinesService } from './po-lines.service.js';
import { LineStatus, PoLine } from './entities/po-line.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { LineAs3bStep } from './entities/line-as3b-step.entity.js';
import { LineSample } from './entities/line-sample.entity.js';
import { UserRole } from '../user/entities/user.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders/:poId/lines')
export class PoLinesController {
  constructor(private readonly service: PoLinesService) {}

  @Get()
  findAll(@Param('poId', ParseUUIDPipe) poId: string) {
    return this.service.findByPo(poId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
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
    @Body() body: { fileKey: string; originalName: string; label?: string; version?: number; fileGroupId?: string },
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
    return this.service.updateSample(sampleId, body, req.user?.email ?? 'system');
  }

  // ─── File Mappings ───────────────────────────────────────────────────────────

  @Post('assign-file')
  assignFile(
    @Param('poId', ParseUUIDPipe) poId: string,
    @Body() body: { fileId: string; lineIds: string[] },
    @Request() req: { user?: { email?: string } },
  ) {
    return this.service.assignFileToLines(poId, body.fileId, body.lineIds, req.user?.email ?? 'system');
  }
}
