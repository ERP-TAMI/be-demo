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
import { ProductionPlansService } from './production-plans.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProductionPlan } from './entities/production-plan.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('production-plans')
export class ProductionPlansController {
  constructor(private readonly service: ProductionPlansService) {}

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

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() body: Partial<ProductionPlan>,
    @Request() req: { user?: { id: string } },
  ) {
    return this.service.create(body, req.user?.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<ProductionPlan>,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/daily')
  upsertDailyPlan(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body() body: { day: number; plannedQty: number; actualQty?: number },
  ) {
    return this.service.upsertDailyPlan(
      planId,
      body.day,
      body.plannedQty,
      body.actualQty,
    );
  }

  @Post(':id/daily/bulk')
  bulkUpsertDailyPlans(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body()
    body: Array<{ day: number; plannedQty: number; actualQty?: number }>,
  ) {
    return this.service.bulkUpsertDailyPlans(planId, body);
  }
}
