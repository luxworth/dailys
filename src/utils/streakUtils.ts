import { CompletionStatus, DayEntry } from '../types';
import { addDays, getLocalDateString } from './dateUtils';

export function calculateStreak(
  entries: Record<string, DayEntry>,
  today: string = getLocalDateString()
): number {
  let streak = 0;
  let cursor = today;

  const todayEntry = entries[today];
  if (!todayEntry || todayEntry.status !== 'SUBMITTED') {
    cursor = addDays(today, -1);
  }

  while (true) {
    const entry = entries[cursor];
    if (!entry || entry.status !== 'SUBMITTED') {
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getHistoryDays(
  entries: Record<string, DayEntry>,
  daysBack: number = 30
): { date: string; status: CompletionStatus | 'NONE' }[] {
  const today = getLocalDateString();
  const history: { date: string; status: CompletionStatus | 'NONE' }[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const entry = entries[date];
    history.push({
      date,
      status: entry?.status ?? 'NONE',
    });
  }

  return history;
}
