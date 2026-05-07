import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyPlan } from './entities/daily-plan.entity.js';
import { ProductionPlan } from './entities/production-plan.entity.js';

// ── Pure types & function (fully testable, no DI) ─────────────────────────────

export interface DailyRow {
  day: number;
  plannedQty: number;
  actualQty: number;
  isManualOverride: boolean;
}

export interface RedistributionInput {
  plannedQuantity: number;
  month: number;
  year: number;
  /** Last day to distribute to (1-31). */
  etdDay: number;
  /** 0 = plan is in a future month (all days are future); 1-31 = today's day in current month. */
  todayDay: number;
  dailyRows: DailyRow[];
}

export interface RedistributionRow {
  day: number;
  plannedQty: number;
  isManualOverride: false;
}

export interface ForecastInput {
  plannedQuantity: number;
  totalActual: number;
  assumedDailyTarget: number;
  mode?:
    | 'average-actual-rate'
    | 'compensate-deficit'
    | 'reduce-pressure'
    | 'shorten-time';
  etdDate: string | null;
  todayDate: string;
  forecastStartDate?: string | null;
  includeSunday?: boolean;
  futureDays: number[];
  dailyRows?: DailyRow[];
}

export interface ForecastResult {
  remaining: number;
  daysNeeded: number;
  completionDate: string | null;
  isLate: boolean;
  daysBeyondEtd: number | null;
  redistributedRows: { day: number; plannedQty: number }[];
  averageActualPerDay?: number | null;
  averageCompletionPct?: number | null;
  forecastReason?: 'average-actual-rate' | null;
  recommendation?: 'split-workshop' | null;
}

/**
 * computeRedistribution — pure function, no side effects.
 * Returns the rows to upsert for future unlocked days.
 */
export function computeRedistribution(
  input: RedistributionInput,
): RedistributionRow[] {
  const { plannedQuantity, etdDay, todayDay, dailyRows } = input;

  const totalActual = dailyRows.reduce((s, r) => s + (r.actualQty ?? 0), 0);

  const lockedFutureTotal = dailyRows
    .filter((r) => r.isManualOverride && r.day > todayDay)
    .reduce((s, r) => s + r.plannedQty, 0);

  const remaining = Math.max(
    0,
    plannedQuantity - totalActual - lockedFutureTotal,
  );

  const lockedDays = new Set(
    dailyRows
      .filter((r) => r.isManualOverride && r.day > todayDay)
      .map((r) => r.day),
  );

  const futureDays: number[] = [];
  for (let d = todayDay + 1; d <= etdDay; d++) {
    if (!lockedDays.has(d)) futureDays.push(d);
  }

  if (futureDays.length === 0) return [];

  const targetPerDay =
    remaining > 0 ? Math.ceil(remaining / futureDays.length) : 0;

  return futureDays.map((day) => ({
    day,
    plannedQty: targetPerDay,
    isManualOverride: false,
  }));
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day)
  ) {
    return startOfDay(new Date(year, month - 1, day));
  }
  return startOfDay(new Date(value));
}

function diffDays(a: Date, b: Date): number {
  return Math.ceil((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function addProductionDays(
  startDate: string,
  daysNeeded: number,
  includeSunday = true,
): string | null {
  if (!Number.isFinite(daysNeeded) || daysNeeded <= 0) return null;
  const cursor = parseIsoDate(startDate);
  let counted = 0;

  while (counted < daysNeeded) {
    const isSunday = cursor.getDay() === 0;
    if (includeSunday || !isSunday) counted += 1;
    if (counted < daysNeeded) cursor.setDate(cursor.getDate() + 1);
  }

  return toIsoDate(cursor);
}

export function computeForecast(input: ForecastInput): ForecastResult {
  const remaining = Math.max(0, input.plannedQuantity - input.totalActual);
  const mode = input.mode || 'shorten-time';
  const forecastStartDate = input.forecastStartDate || input.todayDate;
  const includeSunday = input.includeSunday ?? true;

  if (mode === 'average-actual-rate') {
    const actualRows = (input.dailyRows || []).filter(
      (row) => Number(row.actualQty || 0) > 0,
    );
    const rowsWithPlanAndActual = actualRows.filter(
      (row) => Number(row.plannedQty || 0) > 0,
    );
    const averageActualPerDay =
      actualRows.length > 0 ? input.totalActual / actualRows.length : 0;
    const averageCompletionPct =
      rowsWithPlanAndActual.length > 0
        ? (rowsWithPlanAndActual.reduce(
            (sum, row) =>
              sum + Number(row.actualQty || 0) / Number(row.plannedQty || 1),
            0,
          ) /
            rowsWithPlanAndActual.length) *
          100
        : null;

    if (remaining === 0) {
      return {
        remaining,
        daysNeeded: 0,
        completionDate: toIsoDate(parseIsoDate(input.todayDate)),
        isLate: false,
        daysBeyondEtd: input.etdDate
          ? diffDays(parseIsoDate(input.todayDate), parseIsoDate(input.etdDate))
          : null,
        redistributedRows: input.futureDays.map((day) => ({
          day,
          plannedQty: 0,
        })),
        averageActualPerDay,
        averageCompletionPct,
        forecastReason: 'average-actual-rate',
        recommendation: null,
      };
    }

    if (averageActualPerDay <= 0 || input.futureDays.length === 0) {
      return {
        remaining,
        daysNeeded: Infinity,
        completionDate: null,
        isLate: Boolean(input.etdDate),
        daysBeyondEtd: null,
        redistributedRows: input.futureDays.map((day) => ({
          day,
          plannedQty: 0,
        })),
        averageActualPerDay: actualRows.length > 0 ? averageActualPerDay : null,
        averageCompletionPct,
        forecastReason: 'average-actual-rate',
        recommendation: null,
      };
    }

    const target = Math.ceil(averageActualPerDay);
    const daysNeeded = Math.ceil(remaining / averageActualPerDay);
    const completionDate = addProductionDays(
      forecastStartDate,
      daysNeeded,
      includeSunday,
    );
    const completion = completionDate ? parseIsoDate(completionDate) : null;
    const etd = input.etdDate ? parseIsoDate(input.etdDate) : null;
    const daysBeyondEtd = etd && completion ? diffDays(completion, etd) : null;
    let assigned = 0;

    return {
      remaining,
      daysNeeded,
      completionDate,
      isLate: daysBeyondEtd !== null ? daysBeyondEtd > 0 : false,
      daysBeyondEtd,
      redistributedRows: input.futureDays.map((day) => {
        if (assigned >= remaining) return { day, plannedQty: 0 };
        const plannedQty = Math.min(target, Math.max(0, remaining - assigned));
        assigned += plannedQty;
        return { day, plannedQty };
      }),
      averageActualPerDay,
      averageCompletionPct,
      forecastReason: 'average-actual-rate',
      recommendation:
        daysBeyondEtd !== null && daysBeyondEtd > 0
          ? 'split-workshop'
          : null,
    };
  }

  const requestedTarget = Number(input.assumedDailyTarget || 0);
  const target =
    mode === 'shorten-time'
      ? requestedTarget
      : input.futureDays.length > 0
        ? Math.ceil(remaining / input.futureDays.length)
        : 0;

  if (remaining === 0) {
    return {
      remaining,
      daysNeeded: 0,
      completionDate: toIsoDate(parseIsoDate(input.todayDate)),
      isLate: false,
      daysBeyondEtd: input.etdDate
        ? diffDays(parseIsoDate(input.todayDate), parseIsoDate(input.etdDate))
        : null,
      redistributedRows: input.futureDays.map((day) => ({ day, plannedQty: 0 })),
    };
  }

  if (target <= 0 || input.futureDays.length === 0) {
    return {
      remaining,
      daysNeeded: Infinity,
      completionDate: null,
      isLate: Boolean(input.etdDate),
      daysBeyondEtd: null,
      redistributedRows: input.futureDays.map((day) => ({ day, plannedQty: 0 })),
    };
  }

  const daysNeeded =
    mode === 'shorten-time' ? Math.ceil(remaining / target) : input.futureDays.length;
  const completionDate = addProductionDays(
    forecastStartDate,
    daysNeeded,
    includeSunday,
  );
  const completion = completionDate ? parseIsoDate(completionDate) : null;
  const etd = input.etdDate ? parseIsoDate(input.etdDate) : null;
  const daysBeyondEtd = etd && completion ? diffDays(completion, etd) : null;
  const activeDays = input.futureDays.slice(0, daysNeeded);
  let assigned = 0;

  return {
    remaining,
    daysNeeded,
    completionDate,
    isLate: daysBeyondEtd !== null ? daysBeyondEtd > 0 : false,
    daysBeyondEtd,
    redistributedRows: input.futureDays.map((day) => {
      if (!activeDays.includes(day)) return { day, plannedQty: 0 };
      const plannedQty = Math.min(target, Math.max(0, remaining - assigned));
      assigned += plannedQty;
      return { day, plannedQty };
    }),
  };
}

// ── Injectable NestJS wrapper ─────────────────────────────────────────────────

@Injectable()
export class DynamicTargetEngineService {
  constructor(
    @InjectRepository(ProductionPlan)
    private readonly planRepo: Repository<ProductionPlan>,
    @InjectRepository(DailyPlan)
    private readonly dailyRepo: Repository<DailyPlan>,
  ) {}

  async recalculate(planId: string): Promise<void> {
    const plan = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['line'],
    });
    if (!plan) return;

    const dailyRows = await this.dailyRepo.find({ where: { planId } });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    let todayDay: number;
    if (
      plan.year > currentYear ||
      (plan.year === currentYear && plan.month > currentMonth)
    ) {
      todayDay = 0; // future month — all days are "future"
    } else if (
      plan.year < currentYear ||
      (plan.year === currentYear && plan.month < currentMonth)
    ) {
      return; // past month — nothing to redistribute
    } else {
      todayDay = currentDay;
    }

    // ETD from po_lines.deadline
    let etdDay = 31;
    const deadline: string | null = (plan.line as any)?.deadline ?? null;
    if (deadline) {
      const etd = new Date(deadline);
      const etdYear = etd.getFullYear();
      const etdMonth = etd.getMonth() + 1;
      if (etdYear === plan.year && etdMonth === plan.month) {
        etdDay = etd.getDate();
      } else if (
        etdYear < plan.year ||
        (etdYear === plan.year && etdMonth < plan.month)
      ) {
        return; // ETD is before plan's month — already past
      }
      // ETD beyond this month → keep etdDay = 31
    }

    const rows = computeRedistribution({
      plannedQuantity: plan.plannedQuantity,
      month: plan.month,
      year: plan.year,
      etdDay,
      todayDay,
      dailyRows: dailyRows.map((r) => ({
        day: r.day,
        plannedQty: r.plannedQty,
        actualQty: r.actualQty,
        isManualOverride: r.isManualOverride,
      })),
    });

    if (rows.length === 0) return;

    await Promise.all(
      rows.map(async (r) => {
        const existing = dailyRows.find((d) => d.day === r.day);
        if (existing) {
          existing.plannedQty = r.plannedQty;
          existing.isManualOverride = false;
          await this.dailyRepo.save(existing);
        } else {
          const newRow = this.dailyRepo.create({
            planId,
            day: r.day,
            plannedQty: r.plannedQty,
            actualQty: 0,
            isManualOverride: false,
          });
          await this.dailyRepo.save(newRow);
        }
      }),
    );
  }
}
