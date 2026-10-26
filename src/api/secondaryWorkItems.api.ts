import { SecondaryWorkItem, WorkLog } from '../types';
import { api } from './client';

export const secondaryWorkItemsApi = {
  all: async () => (await api.get<SecondaryWorkItem[]>('/secondary-work-items')).data,
  create: async (payload: { name: string; description?: string }) => (await api.post<SecondaryWorkItem>('/secondary-work-items', payload)).data,
  update: async (id: string, payload: Partial<SecondaryWorkItem>) => (await api.patch<SecondaryWorkItem>(`/secondary-work-items/${id}`, payload)).data,
  workLogs: async (id: string) => (await api.get<WorkLog[]>(`/secondary-work-items/${id}/work-logs`)).data,
};
