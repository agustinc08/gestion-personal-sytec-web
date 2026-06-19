import { Notification } from '../types';
import { api } from './client';

export interface NotificationsResponse { items: Notification[]; unreadCount: number }

export const notificationsApi = {
  all: async () => (await api.get<NotificationsResponse>('/notifications')).data,
  read: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data,
  readAll: async () => (await api.patch('/notifications/read-all')).data,
};
