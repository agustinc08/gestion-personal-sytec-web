import { StatisticsResponse } from '../types';
import { api } from './client';

export type StatisticsFilters = Record<string, string | number | undefined>;

const cleanParams = (filters: StatisticsFilters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== 'todos'),
);

export const statisticsApi = {
  admin: async (filters: StatisticsFilters) => (await api.get<StatisticsResponse>('/statistics/admin', { params: cleanParams(filters) })).data,
  me: async (filters: StatisticsFilters) => (await api.get<StatisticsResponse>('/statistics/me', { params: cleanParams(filters) })).data,
};
