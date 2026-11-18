import { SecondaryWorkItem, WorkLog } from '../types';
import { api } from './client';
import { normalizePage, PageResult } from './pagination';

export const secondaryWorkItemsApi = {
  all: async () => (await api.get<SecondaryWorkItem[]>('/secondary-work-items')).data,
  page: async (params: Record<string, unknown>, signal?: AbortSignal) => normalizePage((await api.get<PageResult<SecondaryWorkItem> | SecondaryWorkItem[]>('/secondary-work-items', { params, signal })).data),
  create: async (payload: { name: string; description?: string }) => (await api.post<SecondaryWorkItem>('/secondary-work-items', payload)).data,
  update: async (id: string, payload: Partial<SecondaryWorkItem>) => (await api.patch<SecondaryWorkItem>(`/secondary-work-items/${id}`, payload)).data,
  workLogs: async (id: string) => (await api.get<WorkLog[]>(`/secondary-work-items/${id}/work-logs`)).data,
};
