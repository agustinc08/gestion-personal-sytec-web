export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export function getArgentinaTodayDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

export function parseDateOnlySafe(value?: string | Date | null) {
  if (!value) return '';
  if (value instanceof Date) return getArgentinaTodayDateOnly(value);
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? match[0] : '';
}

export function formatDateOnlyArgentina(value?: string | Date | null) {
  if (!value) return '';
  if (typeof value === 'string') {
    const dateOnly = parseDateOnlySafe(value);
    if (dateOnly && value.length <= 10) return dateOnly;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return parseDateOnlySafe(value as string);
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0) {
    return date.toISOString().slice(0, 10);
  }
  return getArgentinaTodayDateOnly(date);
}

export function formatDisplayDateArgentina(value?: string | Date | null) {
  const dateOnly = formatDateOnlyArgentina(value);
  if (!dateOnly) return '';
  const [year, month, day] = dateOnly.split('-');
  return day + '/' + month + '/' + year;
}

export function monthNameArgentina(year: number, month: number) {
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: ARGENTINA_TIME_ZONE }).format(new Date(Date.UTC(year, month - 1, 1, 3)));
}

export function addDaysDateOnly(dateOnly: string, days: number) {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12));
}
