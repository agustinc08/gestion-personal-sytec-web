import { Deployment, Project, ProjectUpdate } from '../types';
import { api } from './client';

export const projectsApi = {
  all: async () => (await api.get<Project[]>('/projects')).data,
  my: async () => (await api.get<Project[]>('/projects/my')).data,
  create: async (payload: Omit<Project, 'id' | 'status'>) => (await api.post<Project>('/projects', payload)).data,
  update: async (id: string, payload: Partial<Project>) => (await api.patch<Project>(`/projects/${id}`, payload)).data,
  addUpdate: async (id: string, payload: Partial<ProjectUpdate> & { content: string; authorName?: string }) => (await api.post<Project>(`/projects/${id}/updates`, payload)).data,
  deadlines: async () => (await api.get<Project[]>('/projects/deadlines')).data,
  deployments: async (id: string) => (await api.get<Deployment[]>(`/projects/${id}/deployments`)).data,
  addDeployment: async (id: string, payload: Partial<Deployment>) => (await api.post<Deployment>(`/projects/${id}/deployments`, payload)).data,
  updateDeployment: async (id: string, payload: Partial<Deployment>) => (await api.patch<Deployment>(`/deployments/${id}`, payload)).data,
  removeDeployment: async (id: string) => (await api.delete(`/deployments/${id}`)).data,
};
