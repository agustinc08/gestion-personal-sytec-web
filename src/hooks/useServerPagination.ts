import { useCallback, useEffect, useRef, useState } from 'react';
import { PageResult, normalizePage } from '../api/pagination';

type Loader<T, F extends Record<string, unknown>> = (params: F & { page: number; pageSize: number }, signal: AbortSignal) => Promise<PageResult<T> | T[]>;

export function useServerPagination<T, F extends Record<string, unknown>>(
  loadPage: Loader<T, F>,
  initialFilters: F,
  initialPageSize = 25,
) {
  const loader = useRef(loadPage);
  loader.current = loadPage;
  const [page, setPageValue] = useState(1);
  const [pageSize, setPageSizeValue] = useState(initialPageSize);
  const [filters, setFiltersValue] = useState(initialFilters);
  const [result, setResult] = useState<PageResult<T>>({ items: [], page: 1, pageSize: initialPageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const requestNumber = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestNumber.current;
    setLoading(true);
    setError('');
    loader.current({ ...filters, page, pageSize } as F & { page: number; pageSize: number }, controller.signal)
      .then((data) => {
        if (currentRequest !== requestNumber.current) return;
        const normalized = normalizePage(data);
        setResult(normalized);
        if (page > normalized.totalPages) setPageValue(normalized.totalPages);
      })
      .catch((cause: any) => {
        if (controller.signal.aborted || currentRequest !== requestNumber.current) return;
        setError(cause?.response?.status ? 'No se pudieron cargar los registros.' : 'No hay conexión con el servidor.');
      })
      .finally(() => {
        if (currentRequest === requestNumber.current) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, page, pageSize, refreshKey]);

  const setFilter = useCallback((key: keyof F, value: F[keyof F]) => {
    setFiltersValue((current) => ({ ...current, [key]: value }));
    setPageValue(1);
  }, []);
  const setPage = useCallback((nextPage: number) => setPageValue(Math.max(1, nextPage)), []);
  const setPageSize = useCallback((nextPageSize: number) => {
    setPageSizeValue(Math.min(100, Math.max(1, nextPageSize)));
    setPageValue(1);
  }, []);
  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  return { ...result, page, pageSize, filters, loading, error, setPage, setPageSize, setFilter, refresh };
}
