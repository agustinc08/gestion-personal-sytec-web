import { api } from './client';
import { getArgentinaTodayDateOnly } from '../utils/date';

export const auditApi = {
  all: async (params: Record<string, unknown>) => (await api.get('/audit-logs', { params })).data,
};
export const dashboardV2Api = {
  summary: async () => (await api.get('/dashboard/admin-summary')).data,
  worklogCalendar: async (params: { year: number; month: number }) => (await api.get('/dashboard/admin-worklog-calendar', { params })).data,
};
export const settingsApi = {
  all: async () => (await api.get('/settings')).data,
  update: async (key: string, value: unknown) => (await api.patch(`/settings/${key}`, { value })).data,
};
export const searchApi = { search: async (q: string) => (await api.get('/search', { params: { q } })).data };

export async function downloadExport(resource: string, params: Record<string, unknown> = {}) {
  const response = await api.get(`/exports/${resource}`, { params, responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${resource}_${getArgentinaTodayDateOnly()}.xlsx`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
  URL.revokeObjectURL(url);
}
