import { Dependency } from '../types';
import { api } from './client';

export const dependenciesApi = {
  all: async () => (await api.get<Dependency[]>('/dependencies')).data,
  create: async (payload: Pick<Dependency, 'name'> & Partial<Dependency>) => (await api.post<Dependency>('/dependencies', payload)).data,
  update: async (id: string, payload: Partial<Dependency>) => (await api.patch<Dependency>(`/dependencies/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/dependencies/${id}`)).data,
};
