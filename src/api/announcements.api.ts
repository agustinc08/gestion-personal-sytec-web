import { Announcement } from '../types';
import { api } from './client';
export const announcementsApi = {
  all: async () => (await api.get<Announcement[]>('/announcements')).data,
  active: async () => (await api.get<Announcement[]>('/announcements/active')).data,
  create: async (payload: any) => (await api.post<Announcement>('/announcements', payload)).data,
  update: async (id: string, payload: any) => (await api.patch<Announcement>(`/announcements/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/announcements/${id}`)).data,
  read: async (id: string) => (await api.patch(`/announcements/${id}/read`)).data,
  readAll: async () => (await api.patch('/announcements/read-all')).data,
};
