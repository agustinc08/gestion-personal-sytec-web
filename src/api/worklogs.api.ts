import { WorkLog } from '../types';
import { api } from './client';

export const worklogsApi = {
  all: async () => (await api.get<WorkLog[]>('/work-logs')).data,
  my: async () => (await api.get<WorkLog[]>('/work-logs/my')).data,
  create: async (payload: Omit<WorkLog, 'id'>) => (await api.post<WorkLog>('/work-logs', payload)).data,
  update: async (id: string, payload: Partial<WorkLog>) => (await api.patch<WorkLog>(`/work-logs/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/work-logs/${id}`)).data,
};
