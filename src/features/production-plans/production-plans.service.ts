import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionPlan } from './entities/production-plan.entity.js';
import { DailyPlan } from './entities/daily-plan.entity.js';
import { DynamicTargetEngineService } from './dynamic-target.engine.js';
import { PlansSseService } from './plans-sse.service.js';

@Injectable()
export class ProductionPlansService {
  constructor(
    @InjectRepository(ProductionPlan)
    private readonly planRepo: Repository<ProductionPlan>,
    @InjectRepository(DailyPlan)
    private readonly dailyRepo: Repository<DailyPlan>,
    private readonly engine: DynamicTargetEngineService,
    private readonly sse: PlansSseService,
  ) {}

  async findAll(filters?: {
    lineId?: string;
    workshopId?: string;
    poCode?: string;
    month?: number;
    year?: number;
  }): Promise<ProductionPlan[]> {
    const where: any = {};
    if (filters?.lineId) where.lineId = filters.lineId;
    if (filters?.workshopId) where.workshopId = filters.workshopId;
    if (filters?.month) where.month = filters.month;
    if (filters?.year) where.year = filters.year;

    const plans = await this.planRepo.find({
      where,
      relations: [
        'line',
        'line.po',
        'line.colors',
        'line.colors.sizes',
        'workshop',
        'dailyPlans',
      ],
      relationLoadStrategy: 'query',
      order: {
        year: 'DESC',
        month: 'DESC',
      },
    });

    plans.forEach((p) => {
      if (p.dailyPlans) p.dailyPlans.sort((a, b) => a.day - b.day);
    });

    if (filters?.poCode) {
      const code = filters.poCode.toLowerCase().trim();
      return plans.filter((p) =>
        p.line?.po?.poCode?.toLowerCase().includes(code),
      );
    }

    return plans;
  }

  async findOne(id: string): Promise<ProductionPlan> {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: [
        'line',
        'line.po',
        'line.colors',
        'line.colors.sizes',
        'workshop',
        'dailyPlans',
      ],
      relationLoadStrategy: 'query',
    });
    if (!plan) throw new NotFoundException(`Plan #${id} not found`);
    if (plan.dailyPlans) plan.dailyPlans.sort((a, b) => a.day - b.day);
    return plan;
  }

  async create(
    dto: Partial<ProductionPlan>,
    actorId?: string,
  ): Promise<ProductionPlan> {
    const plan = this.planRepo.create({ ...dto, createdById: actorId });
    return this.planRepo.save(plan);
  }

  async update(
    id: string,
    dto: Partial<ProductionPlan>,
  ): Promise<ProductionPlan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }

  async upsertDailyPlan(
    planId: string,
    day: number,
    plannedQty: number,
    actualQty?: number,
    isManualOverride?: boolean,
  ): Promise<DailyPlan> {
    await this.findOne(planId);
    let daily = await this.dailyRepo.findOne({ where: { planId, day } });
    if (!daily) {
      daily = this.dailyRepo.create({ planId, day });
    }
    daily.plannedQty = plannedQty;
    if (actualQty !== undefined) daily.actualQty = actualQty;
    if (isManualOverride !== undefined) daily.isManualOverride = isManualOverride;
    await this.dailyRepo.save(daily);

    // Run engine when actual is updated OR a manual override is saved
    const shouldRunEngine = actualQty !== undefined || isManualOverride === true;
    if (shouldRunEngine) {
      await this.engine.recalculate(planId);
      this.sse.emit(planId);
    }

    return this.dailyRepo.findOne({ where: { planId, day } }) as Promise<DailyPlan>;
  }

  async bulkUpsertDailyPlans(
    planId: string,
    days: Array<{
      day: number;
      plannedQty: number;
      actualQty?: number;
      isManualOverride?: boolean;
    }>,
  ): Promise<DailyPlan[]> {
    await this.findOne(planId);
    const saved = await Promise.all(
      days.map(async (d) => {
        let daily = await this.dailyRepo.findOne({
          where: { planId, day: d.day },
        });
        if (!daily) daily = this.dailyRepo.create({ planId, day: d.day });
        daily.plannedQty = d.plannedQty;
        if (d.actualQty !== undefined) daily.actualQty = d.actualQty;
        if (d.isManualOverride !== undefined)
          daily.isManualOverride = d.isManualOverride;
        return this.dailyRepo.save(daily);
      }),
    );
    // Run engine once after all rows saved
    await this.engine.recalculate(planId);
    this.sse.emit(planId);
    return saved;
  }
}
