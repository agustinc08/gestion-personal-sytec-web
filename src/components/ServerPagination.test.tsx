import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServerPagination } from './ServerPagination';

afterEach(cleanup);

describe('ServerPagination', () => {
  it('moves to the next server page and exposes compact mobile paging', () => {
    const onPageChange = vi.fn();
    render(<ServerPagination page={1} totalPages={3} total={51} pageSize={25} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByText('1 / 3')).toBeTruthy();
  });

  it('does not show navigation for a single page', () => {
    render(<ServerPagination page={1} totalPages={1} total={3} pageSize={25} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull();
  });
});
