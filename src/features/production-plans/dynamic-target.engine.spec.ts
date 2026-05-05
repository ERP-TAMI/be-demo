import { describe, it, expect } from '@jest/globals';
import {
  computeRedistribution,
  RedistributionInput,
} from './dynamic-target.engine.js';

function makeInput(
  overrides: Partial<RedistributionInput> = {},
): RedistributionInput {
  return {
    plannedQuantity: 500,
    month: 5,
    year: 2026,
    etdDay: 20,
    todayDay: 15,
    dailyRows: [],
    ...overrides,
  };
}

describe('computeRedistribution', () => {
  it('distributes remaining evenly across unlocked future days', () => {
    const result = computeRedistribution(
      makeInput({
        dailyRows: [
          { day: 14, plannedQty: 50, actualQty: 40, isManualOverride: false },
          { day: 15, plannedQty: 50, actualQty: 60, isManualOverride: false },
        ],
        plannedQuantity: 600,
      }),
    );
    // actualTotal = 40+60 = 100, lockedFuture = 0
    // remaining = 600-100 = 500, futureDays=[16,17,18,19,20] (5 days)
    // targetPerDay = ceil(500/5) = 100
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      day: 16,
      plannedQty: 100,
      isManualOverride: false,
    });
    expect(result[4]).toMatchObject({
      day: 20,
      plannedQty: 100,
      isManualOverride: false,
    });
  });

  it('skips locked future days and redistributes only among unlocked ones', () => {
    const result = computeRedistribution(
      makeInput({
        plannedQuantity: 500,
        dailyRows: [
          { day: 18, plannedQty: 80, actualQty: 0, isManualOverride: true },
        ],
      }),
    );
    // actualTotal=0, lockedFuture=80, remaining=420, futureDays=[16,17,19,20] (4 days), ceil(420/4)=105
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.isManualOverride === false)).toBe(true);
    expect(result[0].plannedQty).toBe(105);
  });

  it('returns empty array when no future days exist (past plan)', () => {
    const result = computeRedistribution(
      makeInput({ todayDay: 20, etdDay: 20 }),
    );
    expect(result).toHaveLength(0);
  });

  it('sets targetPerDay to 0 when remaining <= 0 (already done)', () => {
    const result = computeRedistribution(
      makeInput({
        plannedQuantity: 100,
        dailyRows: [
          { day: 10, plannedQty: 100, actualQty: 110, isManualOverride: false },
        ],
      }),
    );
    // remaining = max(0, 100-110) = 0 → all future days get 0
    expect(result.every((r) => r.plannedQty === 0)).toBe(true);
  });

  it('uses ceiling division so rounding is handled', () => {
    // remaining=10, 3 future days → ceil(10/3)=4 each
    const result = computeRedistribution(
      makeInput({
        plannedQuantity: 10,
        todayDay: 17,
        etdDay: 20, // days 18,19,20 = 3 days
      }),
    );
    expect(result).toHaveLength(3);
    expect(result[0].plannedQty).toBe(4);
  });

  it('treats entire month as future when plan is for a future month (todayDay=0)', () => {
    const result = computeRedistribution(
      makeInput({ todayDay: 0, etdDay: 10 }),
    );
    // days 1..10 = 10 future days, remaining=500, ceil(500/10)=50
    expect(result).toHaveLength(10);
    expect(result[0]).toMatchObject({ day: 1, plannedQty: 50 });
  });
});
