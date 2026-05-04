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
import { BomStatus } from './entities/bom.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Bom } from './entities/bom.entity';
import { BomLine } from './entities/bom-line.entity';
import { AggregateFilterDto } from './dto/aggregate-filter.dto';

@UseGuards(JwtAuthGuard)
@Controller('boms')
export class BomsController {
  constructor(private readonly service: BomsService) {}

  @Get()
  findAll(@Query('poId') poId?: string, @Query('lineId') lineId?: string) {
    return this.service.findAll({ poId, lineId });
  }

  /**
   * Tổng hợp vật tư cần đặt từ BOM.
   * Query params:
   *   poIds      - cách nhau bằng dấu phẩy (vd: ?poIds=uuid1,uuid2)
   *   lineIds    - cách nhau bằng dấu phẩy
   *   statuses   - cách nhau bằng dấu phẩy (mặc định: Approved,Locked)
   *   dateFrom   - ISO date string (theo bom.createdAt)
   *   dateTo     - ISO date string
   */
  @Get('aggregate')
  aggregate(
    @Query('poIds') poIds?: string,
    @Query('lineIds') lineIds?: string,
    @Query('statuses') statuses?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filter: AggregateFilterDto = {
      poIds: poIds ? poIds.split(',').filter(Boolean) : undefined,
      lineIds: lineIds ? lineIds.split(',').filter(Boolean) : undefined,
      statuses: statuses ? statuses.split(',').filter(Boolean) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    return this.service.aggregateMaterials(filter);
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
