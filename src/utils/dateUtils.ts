export const APP_LOCALE = 'en-US';

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

export function getMsUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString(APP_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatWeekdayLong(date: Date): string {
  return date.toLocaleDateString(APP_LOCALE, { weekday: 'long' }).toUpperCase();
}

export function formatMonthDayShort(date: Date): string {
  return date.toLocaleDateString(APP_LOCALE, { month: 'short', day: 'numeric' }).toUpperCase();
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString(APP_LOCALE, { month: 'short', day: 'numeric' });
}

export function formatMonthDayYear(date: Date): string {
  return date.toLocaleDateString(APP_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString(APP_LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(APP_LOCALE, {
    month: 'long',
    year: 'numeric',
  });
}
