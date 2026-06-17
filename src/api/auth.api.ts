import { api, TOKEN_KEY } from './client';

export const authApi = {
  async login(cuil: string, password: string) {
    const { data } = await api.post('/auth/login', { cuil, password });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
