import { DayEntry, TaskType } from '../types';
import { getLocalDateString } from './dateUtils';
import { getTaskById } from './taskUtils';

export interface TraceEntry {
  date: string;
  title: string;
  type: TaskType;
  submission?: string;
}

export function getTraceEntries(
  entries: Record<string, DayEntry>,
  limit: number = 10
): TraceEntry[] {
  const today = getLocalDateString();

  return Object.values(entries)
    .filter((entry) => entry.date < today && entry.status === 'SUBMITTED')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((entry) => {
      const task = getTaskById(entry.taskId);
      return {
        date: entry.date,
        title: task?.title ?? 'Unknown task',
        type: task?.type ?? 'TEXT',
        submission: entry.submission,
      };
    });
}

export function formatSubmissionPreview(
  type: TaskType,
  submission?: string
): string {
  if (!submission) {
    return '—';
  }
  if (type === 'IMAGE') {
    return '[Image]';
  }
  return submission;
}
