import { Project } from '../types';
import { api } from './client';

export const projectsApi = {
  all: async () => (await api.get<Project[]>('/projects')).data,
  create: async (payload: Omit<Project, 'id' | 'status'>) => (await api.post<Project>('/projects', payload)).data,
  update: async (id: string, payload: Partial<Project>) => (await api.patch<Project>(`/projects/${id}`, payload)).data,
  addUpdate: async (id: string, content: string, authorName: string) => (await api.post<Project>(`/projects/${id}/updates`, { content, authorName })).data,
};
