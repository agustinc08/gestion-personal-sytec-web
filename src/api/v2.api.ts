import { api } from './client';

export const auditApi = {
  all: async (params: Record<string, unknown>) => (await api.get('/audit-logs', { params })).data,
};
export const dashboardV2Api = { summary: async () => (await api.get('/dashboard/admin-summary')).data };
export const settingsApi = {
  all: async () => (await api.get('/settings')).data,
  update: async (key: string, value: unknown) => (await api.patch(`/settings/${key}`, { value })).data,
};
export const searchApi = { search: async (q: string) => (await api.get('/search', { params: { q } })).data };

export async function downloadExport(resource: string, params: Record<string, unknown> = {}) {
  const response = await api.get(`/exports/${resource}`, { params, responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${resource}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a'); link.href = url; link.download = fileName; link.click();
  URL.revokeObjectURL(url);
}
