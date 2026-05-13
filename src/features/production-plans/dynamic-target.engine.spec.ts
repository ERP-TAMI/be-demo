import { describe, it, expect } from '@jest/globals';
import {
  computeForecast,
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
    includeSunday: false,
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

describe('computeForecast', () => {
  it('marks late when assumed target cannot finish before ETD', () => {
    const result = computeForecast({
      plannedQuantity: 1000,
      totalActual: 100,
      assumedDailyTarget: 100,
      etdDate: '2026-05-12',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    });
    expect(result.remaining).toBe(900);
    expect(result.daysNeeded).toBe(9);
    expect(result.isLate).toBe(true);
  });

  it('marks on time and returns negative daysBeyondEtd when finishing early', () => {
    const result = computeForecast({
      plannedQuantity: 1000,
      totalActual: 100,
      assumedDailyTarget: 300,
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11],
    });
    expect(result.daysNeeded).toBe(3);
    expect(result.isLate).toBe(false);
    expect(result.daysBeyondEtd).toBeLessThan(0);
  });

  it('handles remaining = 0', () => {
    const result = computeForecast({
      plannedQuantity: 100,
      totalActual: 100,
      assumedDailyTarget: 0,
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10],
    });
    expect(result.remaining).toBe(0);
    expect(result.daysNeeded).toBe(0);
    expect(result.redistributedRows.every((row) => row.plannedQty === 0)).toBe(true);
  });

  it('handles assumedDailyTarget = 0', () => {
    const result = computeForecast({
      plannedQuantity: 100,
      totalActual: 0,
      assumedDailyTarget: 0,
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10],
    });
    expect(result.daysNeeded).toBe(Infinity);
    expect(result.completionDate).toBeNull();
  });

  it('compensate-deficit spreads remaining across all future days', () => {
    const result = computeForecast({
      plannedQuantity: 600,
      totalActual: 100,
      assumedDailyTarget: 1,
      mode: 'compensate-deficit',
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12, 13],
    });
    expect(result.redistributedRows).toHaveLength(5);
    expect(result.redistributedRows.every((row) => row.plannedQty === 100)).toBe(true);
  });

  it('reduce-pressure keeps all future days active', () => {
    const result = computeForecast({
      plannedQuantity: 300,
      totalActual: 100,
      assumedDailyTarget: 999,
      mode: 'reduce-pressure',
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12],
    });
    expect(result.daysNeeded).toBe(4);
    expect(result.redistributedRows.every((row) => row.plannedQty === 50)).toBe(true);
  });

  it('shorten-time clears extra future days', () => {
    const result = computeForecast({
      plannedQuantity: 300,
      totalActual: 100,
      assumedDailyTarget: 100,
      mode: 'shorten-time',
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12],
    });
    expect(result.daysNeeded).toBe(2);
    expect(result.redistributedRows).toEqual([
      { day: 9, plannedQty: 100 },
      { day: 10, plannedQty: 100 },
      { day: 11, plannedQty: 0 },
      { day: 12, plannedQty: 0 },
    ]);
  });

  it('does not count Sundays in completion date when includeSunday is false', () => {
    const result = computeForecast({
      plannedQuantity: 300,
      totalActual: 0,
      assumedDailyTarget: 100,
      mode: 'shorten-time',
      etdDate: '2026-05-15',
      todayDate: '2026-05-08',
      forecastStartDate: '2026-05-09',
      includeSunday: false,
      futureDays: [9, 11, 12],
    });
    expect(result.daysNeeded).toBe(3);
    expect(result.completionDate).toBe('2026-05-12');
  });

  it('average-actual-rate forecasts late when workshop is consistently slow', () => {
    const result = computeForecast({
      plannedQuantity: 1000,
      totalActual: 200,
      assumedDailyTarget: 0,
      mode: 'average-actual-rate',
      etdDate: '2026-05-12',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12, 13, 14, 15, 16],
      dailyRows: [
        { day: 6, plannedQty: 150, actualQty: 90, isManualOverride: false },
        { day: 7, plannedQty: 150, actualQty: 110, isManualOverride: false },
      ],
    });
    expect(result.averageActualPerDay).toBe(100);
    expect(result.averageCompletionPct).toBeCloseTo(66.67, 1);
    expect(result.daysNeeded).toBe(8);
    expect(result.isLate).toBe(true);
    expect(result.forecastReason).toBe('average-actual-rate');
    expect(result.recommendation).toBe('split-workshop');
  });

  it('average-actual-rate returns no completion date when there is no actual data', () => {
    const result = computeForecast({
      plannedQuantity: 1000,
      totalActual: 0,
      assumedDailyTarget: 0,
      mode: 'average-actual-rate',
      etdDate: '2026-05-20',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11],
      dailyRows: [],
    });
    expect(result.averageActualPerDay).toBeNull();
    expect(result.averageCompletionPct).toBeNull();
    expect(result.daysNeeded).toBe(Infinity);
    expect(result.completionDate).toBeNull();
    expect(result.forecastReason).toBe('average-actual-rate');
  });

  it('average-actual-rate marks on time when actual average is fast enough', () => {
    const result = computeForecast({
      plannedQuantity: 1000,
      totalActual: 600,
      assumedDailyTarget: 0,
      mode: 'average-actual-rate',
      etdDate: '2026-05-12',
      todayDate: '2026-05-08',
      futureDays: [9, 10, 11, 12],
      dailyRows: [
        { day: 6, plannedQty: 150, actualQty: 300, isManualOverride: false },
        { day: 7, plannedQty: 150, actualQty: 300, isManualOverride: false },
      ],
    });
    expect(result.averageActualPerDay).toBe(300);
    expect(result.daysNeeded).toBe(2);
    expect(result.isLate).toBe(false);
    expect(result.recommendation).toBeNull();
  });
});
