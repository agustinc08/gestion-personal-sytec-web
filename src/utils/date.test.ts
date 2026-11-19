import { describe, expect, it } from 'vitest';
import { getMonthDateOnlyRange, parseDateOnlySafe } from './date';

describe('date-only calendar ranges', () => {
  it('uses the real last day for November 2026', () => {
    expect(getMonthDateOnlyRange(2026, 11)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('handles leap years and rejects impossible date-only values', () => {
    expect(getMonthDateOnlyRange(2028, 2)).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(parseDateOnlySafe('2026-11-31')).toBe('');
    expect(parseDateOnlySafe('2026-11-30')).toBe('2026-11-30');
    expect(parseDateOnlySafe(new Date('invalid'))).toBe('');
  });
});
