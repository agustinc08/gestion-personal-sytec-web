import { StrikeConfig } from '../types';
import { api } from './client';

export const strikeApi = {
  config: async () => (await api.get<StrikeConfig>('/strike/config')).data,
  updateConfig: async (payload: StrikeConfig) => (await api.patch<StrikeConfig>('/strike/config', payload)).data,
  remoteDays: async () => (await api.get('/strike/remote-days')).data,
};
