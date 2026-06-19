import React, { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], resetKeys: unknown[] = []) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => setPage(1), [pageSize, ...resetKeys]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const rows = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { rows, page, pageSize, pages, total: items.length, setPage, setPageSize: setPageSizeState };
}

export function Pagination({ page, pageSize, pages, total, setPage, setPageSize }: ReturnType<typeof usePagination<any>>) {
  if (total === 0) return <p className="py-5 text-center text-sm text-slate-400">Sin registros</p>;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-4 text-xs text-slate-600">
      <span>Mostrando {first}-{last} de {total}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1"><span className="sr-only">Registros por página</span><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">{[10, 25, 50].map((size) => <option key={size} value={size}>{size} por página</option>)}</select></label>
        <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button>
        <strong>Página {page} de {pages}</strong>
        <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button>
      </div>
    </div>
  );
}
