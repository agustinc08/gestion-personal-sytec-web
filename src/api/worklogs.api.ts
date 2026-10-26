import { DailyAttendance, WorkLog } from '../types';
import { api } from './client';

export type WorkLogFilters = Record<string, string | number | undefined>;

const cleanParams = (filters: WorkLogFilters = {}) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== 'todos'),
);

export const worklogsApi = {
  all: async (filters?: WorkLogFilters) => (await api.get<WorkLog[]>('/work-logs', { params: cleanParams(filters) })).data,
  my: async (filters?: WorkLogFilters) => (await api.get<WorkLog[]>('/work-logs/my', { params: cleanParams(filters) })).data,
  create: async (payload: Omit<WorkLog, 'id'>) => (await api.post<WorkLog>('/work-logs', payload)).data,
  update: async (id: string, payload: Partial<WorkLog>) => (await api.patch<WorkLog>(`/work-logs/${id}`, payload)).data,
  attendance: async (filters?: WorkLogFilters) => (await api.get<DailyAttendance[]>('/work-logs/attendance', { params: cleanParams(filters) })).data,
  saveAttendance: async (payload: Partial<DailyAttendance> & { date: string }) => (await api.post<DailyAttendance>('/work-logs/attendance', payload)).data,
  remove: async (id: string) => (await api.delete(`/work-logs/${id}`)).data,
};