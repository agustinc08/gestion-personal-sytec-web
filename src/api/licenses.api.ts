import { LicenseRequest, LicenseRule } from '../types';
import { api } from './client';

export const licensesApi = {
  all: async () => (await api.get<LicenseRequest[]>('/licenses')).data,
  my: async () => (await api.get<LicenseRequest[]>('/licenses/my')).data,
  rules: async () => (await api.get<LicenseRule[]>('/licenses/rules')).data,
  create: async (payload: Partial<LicenseRequest>) => (await api.post<LicenseRequest>('/licenses', payload)).data,
  update: async (id: string, payload: Partial<LicenseRequest>) => (await api.patch<LicenseRequest>(`/licenses/${id}`, payload)).data,
  approve: async (id: string) => (await api.patch<LicenseRequest>(`/licenses/${id}/approve`)).data,
  reject: async (id: string) => (await api.patch<LicenseRequest>(`/licenses/${id}/reject`)).data,
};
