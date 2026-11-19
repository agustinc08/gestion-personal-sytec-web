import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import { employeesApi } from './employees.api';
import { licensesApi } from './licenses.api';
import { projectsApi } from './projects.api';
import { secondaryWorkItemsApi } from './secondaryWorkItems.api';
import { worklogsApi } from './worklogs.api';

vi.mock('./client', () => ({ api: { get: vi.fn() }, resolveApiFileUrl: (path?: string) => path || '' }));

const pageResult = { items: [{ id: 'row-1' }], page: 2, pageSize: 25, total: 51, totalPages: 3 };

describe('server-paginated list clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: pageResult } as never);
  });

  it.each([
    ['employees', employeesApi.page, '/employees', { page: 2, pageSize: 25, q: 'Ada', dependencyId: 'dep-1' }],
    ['projects', projectsApi.page, '/projects', { page: 2, pageSize: 25, q: 'Portal', lifecycle: 'active' }],
    ['employee projects', projectsApi.myPage, '/projects/my', { page: 2, pageSize: 25 }],
    ['employee projects first page', projectsApi.myPage, '/projects/my', { page: 1, pageSize: 25 }],
    ['work logs', worklogsApi.page, '/work-logs', { page: 2, pageSize: 25, employeeId: 'emp-1', projectId: 'proj-1' }],
    ['employee work logs', worklogsApi.myPage, '/work-logs/my', { page: 2, pageSize: 25, employeeId: 'emp-1' }],
    ['employee work logs calendar page', worklogsApi.myPage, '/work-logs/my', { page: 1, pageSize: 100, year: '2026', month: '11', employeeId: 'emp-1' }],
    ['attendance', worklogsApi.attendancePage, '/work-logs/attendance', { page: 2, pageSize: 25, employeeId: 'emp-1', month: '11' }],
    ['licenses', licensesApi.page, '/licenses', { page: 2, pageSize: 25, status: 'pendiente', q: 'Ada' }],
    ['employee licenses', licensesApi.myPage, '/licenses/my', { page: 2, pageSize: 25 }],
    ['employee licenses first page', licensesApi.myPage, '/licenses/my', { page: 1, pageSize: 25 }],
    ['secondary work items', secondaryWorkItemsApi.page, '/secondary-work-items', { page: 2, pageSize: 25, q: 'soporte' }],
  ])('requests page and filters for %s and preserves server totals', async (_name, loadPage, endpoint, params) => {
    const result = await loadPage(params as never);
    expect(api.get).toHaveBeenCalledWith(endpoint, expect.objectContaining({ params }));
    expect(result).toMatchObject({ page: 2, pageSize: 25, total: 51, totalPages: 3 });
  });
});
