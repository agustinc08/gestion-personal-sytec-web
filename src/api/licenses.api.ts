import { LicenseRequest, LicenseRule } from '../types';
import { api } from './client';
import { normalizePage, PageResult } from './pagination';

export const licensesApi = {
  all: async () => (await api.get<LicenseRequest[]>('/licenses')).data,
  page: async (params: Record<string, unknown>, signal?: AbortSignal) => normalizePage((await api.get<PageResult<LicenseRequest> | LicenseRequest[]>('/licenses', { params, signal })).data),
  my: async () => (await api.get<LicenseRequest[]>('/licenses/my')).data,
  myPage: async (params: Record<string, unknown>, signal?: AbortSignal) => normalizePage((await api.get<PageResult<LicenseRequest> | LicenseRequest[]>('/licenses/my', { params, signal })).data),
  rules: async () => (await api.get<LicenseRule[]>('/licenses/rules')).data,
  create: async (payload: Partial<LicenseRequest>) => (await api.post<LicenseRequest>('/licenses', payload)).data,
  uploadCertificate: async (id: string, file: File) => {
    const form = new FormData();
    form.append('certificate', file);
    return (await api.post<LicenseRequest>(`/licenses/${id}/certificate`, form)).data;
  },
  downloadCertificate: async (id: string) => (await api.get<Blob>(`/licenses/${id}/certificate`, { responseType: 'blob' })).data,
  update: async (id: string, payload: Partial<LicenseRequest>) => (await api.patch<LicenseRequest>(`/licenses/${id}`, payload)).data,
  approve: async (id: string) => (await api.patch<LicenseRequest>(`/licenses/${id}/approve`)).data,
  reject: async (id: string) => (await api.patch<LicenseRequest>(`/licenses/${id}/reject`)).data,
  remove: async (id: string) => (await api.delete(`/licenses/${id}`)).data,
  clear: async () => (await api.delete('/licenses')).data,
};
