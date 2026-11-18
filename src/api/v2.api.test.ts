import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditApi } from './v2.api';
import { api } from './client';

vi.mock('./client', () => ({ api: { get: vi.fn() } }));

describe('auditApi pagination', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends page and filters to the server and normalizes the page response', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [{ id: 'log-2' }], page: 2, pageSize: 25, total: 26, totalPages: 2 } } as never);
    const result = await auditApi.all({ page: 2, pageSize: 25, q: 'Ada' });
    expect(api.get).toHaveBeenCalledWith('/audit-logs', { params: { page: 2, pageSize: 25, q: 'Ada' } });
    expect(result).toMatchObject({ items: [{ id: 'log-2' }], page: 2, totalPages: 2 });
  });
});
