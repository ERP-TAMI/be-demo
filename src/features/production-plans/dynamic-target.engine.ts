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
