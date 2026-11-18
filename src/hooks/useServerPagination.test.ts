import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useServerPagination } from './useServerPagination';

describe('useServerPagination', () => {
  it('requests page one and moves the server query to page two', async () => {
    const loadPage = vi.fn(async ({ page, pageSize }: { page: number; pageSize: number }) => ({
      items: [{ id: `row-${page}` }], page, pageSize, total: 51, totalPages: 3,
    }));
    const { result } = renderHook(() => useServerPagination(loadPage, { q: '' }));
    await waitFor(() => expect(result.current.totalPages).toBe(3));
    expect(loadPage).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 25 }), expect.any(AbortSignal));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.items[0]?.id).toBe('row-2'));
    expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, pageSize: 25 }), expect.any(AbortSignal));
  });

  it('resets to page one on search and page-size change and clamps removed pages', async () => {
    const loadPage = vi.fn(async ({ page, pageSize, q }: { page: number; pageSize: number; q: string }) => ({
      items: [{ id: `${q}-${page}` }], page, pageSize, total: q ? 5 : 51, totalPages: q ? 1 : 3,
    }));
    const { result } = renderHook(() => useServerPagination(loadPage, { q: '' }));
    await waitFor(() => expect(result.current.totalPages).toBe(3));
    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));
    act(() => result.current.setFilter('q', 'ana'));
    await waitFor(() => expect(result.current.items[0]?.id).toBe('ana-1'));
    expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'ana', page: 1 }), expect.any(AbortSignal));
    act(() => result.current.setPageSize(50));
    await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'ana', page: 1, pageSize: 50 }), expect.any(AbortSignal)));
  });
});
