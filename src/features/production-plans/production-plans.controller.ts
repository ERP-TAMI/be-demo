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
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProductionPlansService } from './production-plans.service.js';
import { PlansSseService } from './plans-sse.service.js';
import { UpsertDailyPlanDto } from './dto/upsert-daily-plan.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProductionPlan } from './entities/production-plan.entity.js';

@Controller('production-plans')
export class ProductionPlansController {
  constructor(
    private readonly service: ProductionPlansService,
    private readonly sse: PlansSseService,
  ) {}

  // ── SSE — no JWT guard (EventSource cannot send custom headers) ───────────
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.sse.observe();
  }

  // ── CRUD — all require JWT ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('lineId') lineId?: string,
    @Query('workshopId') workshopId?: string,
    @Query('poCode') poCode?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.findAll({
      lineId,
      workshopId,
      poCode,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: Partial<ProductionPlan>,
    @Request() req: { user?: { id: string } },
  ) {
    return this.service.create(body, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<ProductionPlan>,
  ) {
    return this.service.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/daily')
  upsertDailyPlan(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body() body: UpsertDailyPlanDto,
  ) {
    return this.service.upsertDailyPlan(
      planId,
      body.day,
      body.plannedQty,
      body.actualQty,
      body.isManualOverride,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/daily/bulk')
  bulkUpsertDailyPlans(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body()
    body: Array<{
      day: number;
      plannedQty: number;
      actualQty?: number;
      isManualOverride?: boolean;
    }>,
  ) {
    return this.service.bulkUpsertDailyPlans(planId, body);
  }
}
