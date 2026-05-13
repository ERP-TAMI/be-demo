import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionPlan } from './entities/production-plan.entity.js';
import { DailyPlan } from './entities/daily-plan.entity.js';
import {
  computeForecast,
  DynamicTargetEngineService,
  ForecastResult,
} from './dynamic-target.engine.js';
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
    this.assertPlanPeriodIsNotPast(dto.year, dto.month);
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
    const plan = await this.findOne(planId);
    this.assertManualPlanDayIsNotPast(plan, day, actualQty, isManualOverride);
    let daily = await this.dailyRepo.findOne({ where: { planId, day } });
    if (!daily) {
      daily = this.dailyRepo.create({ planId, day });
    }
    daily.plannedQty = plannedQty;
    if (actualQty !== undefined) daily.actualQty = actualQty;
    if (isManualOverride !== undefined)
      daily.isManualOverride = isManualOverride;
    await this.dailyRepo.save(daily);

    // Run engine when actual is updated OR a manual override is saved
    const shouldRunEngine =
      actualQty !== undefined || isManualOverride === true;
    if (shouldRunEngine) {
      await this.engine.recalculate(planId);
      this.sse.emit(planId);
    }

    return this.dailyRepo.findOne({
      where: { planId, day },
    }) as Promise<DailyPlan>;
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
    const plan = await this.findOne(planId);
    days.forEach((day) =>
      this.assertManualPlanDayIsNotPast(
        plan,
        day.day,
        day.actualQty,
        day.isManualOverride,
      ),
    );
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

  private assertPlanPeriodIsNotPast(year?: number, month?: number): void {
    const planYear = Number(year || 0);
    const planMonth = Number(month || 0);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (
      planYear < currentYear ||
      (planYear === currentYear && planMonth < currentMonth)
    ) {
      throw new BadRequestException(
        'Cannot create production plans in a past month',
      );
    }
  }

  private assertManualPlanDayIsNotPast(
    plan: ProductionPlan,
    day: number,
    actualQty?: number,
    isManualOverride?: boolean,
  ): void {
    const updatesPlannedQty = actualQty === undefined || isManualOverride === true;
    if (!updatesPlannedQty) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const isPastDay =
      plan.year < currentYear ||
      (plan.year === currentYear && plan.month < currentMonth) ||
      (plan.year === currentYear &&
        plan.month === currentMonth &&
        Number(day) < currentDay);

    if (isPastDay) {
      throw new BadRequestException(
        'Cannot update planned quantities for past days',
      );
    }
  }

  private isSunday(year: number, month: number, day: number): boolean {
    return new Date(year, month - 1, day).getDay() === 0;
  }

  private formatLocalDate(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private planIncludesSunday(plan: ProductionPlan): boolean {
    return (plan.dailyPlans || []).some(
      (row) =>
        this.isSunday(plan.year, plan.month, row.day) &&
        (Number(row.plannedQty || 0) > 0 || Number(row.actualQty || 0) > 0),
    );
  }

  private getFutureDays(
    plan: ProductionPlan,
    today = new Date(),
    includeSundayOverride?: boolean,
  ): number[] {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const includeSunday = includeSundayOverride ?? this.planIncludesSunday(plan);
    const startDay =
      plan.year > currentYear ||
      (plan.year === currentYear && plan.month > currentMonth)
        ? 1
        : plan.year === currentYear && plan.month === currentMonth
          ? currentDay + 1
          : 32;

    let lastDay = new Date(plan.year, plan.month, 0).getDate();
    const deadline: string | null = (plan.line as any)?.deadline ?? null;
    if (deadline) {
      const etd = new Date(deadline);
      const etdYear = etd.getFullYear();
      const etdMonth = etd.getMonth() + 1;
      if (etdYear === plan.year && etdMonth === plan.month) {
        lastDay = Math.min(lastDay, etd.getDate());
      }
    }

    const days: number[] = [];
    for (let day = startDay; day <= lastDay; day += 1) {
      if (!includeSunday && this.isSunday(plan.year, plan.month, day)) continue;
      days.push(day);
    }
    return days;
  }

  private getForecastStartDate(
    plan: ProductionPlan,
    futureDays: number[],
    today: Date,
  ): string {
    if (futureDays.length > 0) {
      return `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(
        futureDays[0],
      ).padStart(2, '0')}`;
    }
    return this.formatLocalDate(today);
  }

  async forecast(
    planId: string,
    assumedDailyTarget: number,
    mode:
      | 'average-actual-rate'
      | 'compensate-deficit'
      | 'reduce-pressure'
      | 'shorten-time' = 'shorten-time',
    includeSundayOverride?: boolean,
  ): Promise<ForecastResult> {
    const plan = await this.findOne(planId);
    const totalActual = (plan.dailyPlans || []).reduce(
      (sum, row) => sum + Number(row.actualQty || 0),
      0,
    );
    const today = new Date();
    const deadline: string | null = (plan.line as any)?.deadline ?? null;
    const includeSunday = includeSundayOverride ?? this.planIncludesSunday(plan);
    const futureDays = this.getFutureDays(plan, today, includeSunday);
    return computeForecast({
      plannedQuantity: Number(plan.plannedQuantity || 0),
      totalActual,
      assumedDailyTarget: Number(assumedDailyTarget || 0),
      mode,
      etdDate: deadline ? new Date(deadline).toISOString().slice(0, 10) : null,
      todayDate: this.formatLocalDate(today),
      forecastStartDate: this.getForecastStartDate(plan, futureDays, today),
      includeSunday,
      futureDays,
      dailyRows: (plan.dailyPlans || []).map((row) => ({
        day: row.day,
        plannedQty: row.plannedQty,
        actualQty: row.actualQty,
        isManualOverride: row.isManualOverride,
      })),
    });
  }

  async applyRedistribution(
    planId: string,
    mode: 'compensate-deficit' | 'reduce-pressure' | 'shorten-time',
    assumedDailyTarget?: number,
    includeSundayOverride?: boolean,
  ): Promise<DailyPlan[]> {
    const plan = await this.findOne(planId);
    const futureDays = this.getFutureDays(plan, new Date(), includeSundayOverride);
    const totalActual = (plan.dailyPlans || []).reduce(
      (sum, row) => sum + Number(row.actualQty || 0),
      0,
    );
    const remaining = Math.max(
      0,
      Number(plan.plannedQuantity || 0) - totalActual,
    );
    const target = mode === 'shorten-time'
      ? Number(assumedDailyTarget || 0)
      : futureDays.length > 0
        ? Math.ceil(remaining / futureDays.length)
        : 0;
    const forecast = await this.forecast(
      planId,
      target,
      mode,
      includeSundayOverride,
    );
    const rows = forecast.redistributedRows.map((row) => ({
      day: row.day,
      plannedQty: row.plannedQty,
      actualQty: plan.dailyPlans?.find((daily) => daily.day === row.day)?.actualQty ?? 0,
      isManualOverride: true,
    }));
    const saved = await this.bulkUpsertDailyPlans(planId, rows);
    this.sse.emit(planId);

    // Handle spillover to upcoming months
    let spillover = forecast.spilloverQuantity || 0;
    let currentPlan = plan;

    while (spillover > 0 && target > 0) {
      let nextMonth = currentPlan.month + 1;
      let nextYear = currentPlan.year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      const includeSun = includeSundayOverride ?? this.planIncludesSunday(currentPlan);
      const nextFutureDays: number[] = [];
      for (let d = 1; d <= daysInNextMonth; d++) {
        if (!includeSun && this.isSunday(nextYear, nextMonth, d)) continue;
        nextFutureDays.push(d);
      }

      let assignedInNext = 0;
      const nextRowsData = nextFutureDays.map(day => {
        if (assignedInNext >= spillover) return null;
        const qty = Math.min(target, spillover - assignedInNext);
        assignedInNext += qty;
        return { day, qty };
      }).filter(Boolean) as {day: number, qty: number}[];

      if (assignedInNext === 0) break; // Should not happen unless no workdays

      let nextPlan = await this.planRepo.findOne({
        where: {
          lineId: currentPlan.lineId,
          workshopId: currentPlan.workshopId,
          month: nextMonth,
          year: nextYear,
        },
        relations: ['dailyPlans']
      });

      if (!nextPlan) {
        nextPlan = await this.create({
          lineId: currentPlan.lineId,
          workshopId: currentPlan.workshopId,
          month: nextMonth,
          year: nextYear,
          plannedQuantity: assignedInNext,
          note: currentPlan.note,
        });
        nextPlan.dailyPlans = [];
      } else {
        nextPlan.plannedQuantity = Number(nextPlan.plannedQuantity || 0) + assignedInNext;
        await this.planRepo.save(nextPlan);
      }

      const nextRows = nextRowsData.map(({day, qty}) => ({
        day,
        plannedQty: qty + Number(nextPlan.dailyPlans?.find(x => x.day === day)?.plannedQty || 0),
        actualQty: nextPlan.dailyPlans?.find(x => x.day === day)?.actualQty ?? 0,
        isManualOverride: true,
      }));

      await this.bulkUpsertDailyPlans(nextPlan.id, nextRows);
      
      spillover -= assignedInNext;
      currentPlan = nextPlan;
    }

    return saved;
  }
}
