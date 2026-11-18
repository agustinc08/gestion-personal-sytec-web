import React from 'react';

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function ServerPagination({ page, totalPages, total, pageSize, loading = false, onPageChange, onPageSizeChange }: Props) {
  if (totalPages <= 1) return null;
  return <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-200">
    <span>{total ? `Mostrando ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} de ${total}` : 'Sin registros'}</span>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {onPageSizeChange && <label className="flex items-center gap-1"><span className="sr-only">Registros por página</span><select aria-label="Registros por página" value={pageSize} disabled={loading} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="min-h-9 rounded-md border border-slate-300 bg-white px-2 dark:border-slate-600 dark:bg-slate-800">{[25, 50, 100].map((size) => <option key={size} value={size}>{size} por página</option>)}</select></label>}
      {totalPages > 1 && <><button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} className="min-h-9 rounded-md border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600">Anterior</button><span aria-live="polite" className="whitespace-nowrap">{page} / {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} className="min-h-9 rounded-md border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600">Siguiente</button></>}
    </div>
  </nav>;
}
