import { CreateEmployeePayload, Employee, UpdateEmployeePayload } from '../types';
import { api, resolveApiFileUrl } from './client';

const normalizeEmployee = (employee: Employee) => ({
  ...employee,
  avatar: resolveApiFileUrl(employee.avatar),
});

export const employeesApi = {
  all: async () => (await api.get<Employee[]>('/employees')).data.map(normalizeEmployee),
  me: async () => normalizeEmployee((await api.get<Employee>('/employees/me')).data),
  create: async (payload: CreateEmployeePayload) => normalizeEmployee((await api.post<Employee>('/employees', payload)).data),
  update: async (id: string, payload: UpdateEmployeePayload) => normalizeEmployee((await api.patch<Employee>(`/employees/${id}`, payload)).data),
  updateMe: async (payload: UpdateEmployeePayload) => normalizeEmployee((await api.patch<Employee>('/employees/me', payload)).data),
  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return normalizeEmployee((await api.post<Employee>(`/employees/${id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data);
  },
  uploadMyAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return normalizeEmployee((await api.post<Employee>('/employees/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data);
  },
  resetGuardias: async (id: string) => normalizeEmployee((await api.post<Employee>(`/employees/${id}/reset-guardias`)).data),
  adjustCompensatoryDays: async (id: string, days: number) => normalizeEmployee((await api.patch<Employee>(`/employees/${id}/compensatory-days`, { days })).data),
  remove: async (id: string) => (await api.delete(`/employees/${id}`)).data,
};
