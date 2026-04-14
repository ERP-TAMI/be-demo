import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BomsService } from './boms.service.js';
import { BomStatus } from './entities/bom.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Bom } from './entities/bom.entity.js';
import { BomLine } from './entities/bom-line.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('boms')
export class BomsController {
  constructor(private readonly service: BomsService) {}

  @Get()
  findAll(@Query('poId') poId?: string, @Query('lineId') lineId?: string) {
    return this.service.findAll({ poId, lineId });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() body: Partial<Bom>,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<Bom>,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.update(id, body, req.user?.email ?? 'system');
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: BomStatus,
    @Body('rejectReason') rejectReason: string,
    @Request() req: { user?: { id: string; email: string } },
  ) {
    return this.service.updateStatus(
      id,
      status,
      req.user?.id,
      rejectReason,
      req.user?.email ?? 'system',
    );
  }

  @Post(':id/lines')
  addLine(
    @Param('id', ParseUUIDPipe) bomId: string,
    @Body() body: Partial<BomLine>,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.addLine(bomId, body, req.user?.email ?? 'system');
  }

  @Patch(':id/lines/:lineId')
  updateLine(
    @Param('id', ParseUUIDPipe) bomId: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() body: Partial<BomLine>,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.updateLine(
      bomId,
      lineId,
      body,
      req.user?.email ?? 'system',
    );
  }

  @Delete(':id/lines/:lineId')
  removeLine(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.removeLine(lineId, req.user?.email ?? 'system');
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
