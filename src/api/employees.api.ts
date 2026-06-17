import { Employee } from '../types';
import { api } from './client';

export const employeesApi = {
  all: async () => (await api.get<Employee[]>('/employees')).data,
  me: async () => (await api.get<Employee>('/employees/me')).data,
  create: async (payload: Partial<Employee>) => (await api.post<Employee>('/employees', payload)).data,
  update: async (id: string, payload: Partial<Employee>) => (await api.patch<Employee>(`/employees/${id}`, payload)).data,
  updateMe: async (payload: Partial<Employee>) => (await api.patch<Employee>('/employees/me', payload)).data,
  remove: async (id: string) => (await api.delete(`/employees/${id}`)).data,
};
