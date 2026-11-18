export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  employeeId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function normalizePage<T>(data: PageResult<T> | T[]): PageResult<T> {
  if (Array.isArray(data)) {
    return { items: data, page: 1, pageSize: data.length, total: data.length, totalPages: 1 };
  }
  const total = Number.isFinite(data.total) ? data.total : data.items.length;
  const pageSize = Number.isFinite(data.pageSize) ? data.pageSize : data.items.length;
  return {
    items: data.items,
    page: Number.isFinite(data.page) ? data.page : 1,
    pageSize,
    total,
    totalPages: Number.isFinite(data.totalPages) ? Math.max(1, data.totalPages) : Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}
