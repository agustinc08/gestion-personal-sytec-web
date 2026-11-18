import { getArgentinaTodayDateOnly } from './date';

export type WorkdayStatus = 'WEEKEND' | 'STRIKE' | 'REMOTE' | 'PRESENTIAL';

export function getWorkdayStatus(date: string, remoteDays: string[] = [], strikeDate?: string): WorkdayStatus {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(year, month - 1, day, 12).getDay();
  if (strikeDate === date) return 'STRIKE';
  if (weekday === 0 || weekday === 6) return 'WEEKEND';
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return remoteDays.some((value) => value.trim().toLocaleLowerCase('es') === dayNames[weekday].toLocaleLowerCase('es')) ? 'REMOTE' : 'PRESENTIAL';
}

export const requiresWorkLog = (status: WorkdayStatus) => status === 'REMOTE' || status === 'PRESENTIAL';
export const currentWorkdayStatus = (remoteDays: string[], strikeDate?: string) => getWorkdayStatus(getArgentinaTodayDateOnly(), remoteDays, strikeDate);
