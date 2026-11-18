import { describe, expect, it } from 'vitest';
import { normalizePage } from './pagination';

describe('normalizePage', () => {
  it('normalizes legacy array responses', () => {
    expect(normalizePage([{ id: 'a' }])).toEqual({ items: [{ id: 'a' }], page: 1, pageSize: 1, total: 1, totalPages: 1 });
  });

  it('preserves server pagination metadata', () => {
    expect(normalizePage({ items: [{ id: 'a' }], page: 2, pageSize: 25, total: 51, totalPages: 3 })).toEqual({
      items: [{ id: 'a' }], page: 2, pageSize: 25, total: 51, totalPages: 3,
    });
  });
});
