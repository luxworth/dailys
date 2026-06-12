import { TASKS } from '../data/tasks';
import { Task } from '../types';

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTaskForDate(dateStr: string): Task {
  const index = hashDate(dateStr) % TASKS.length;
  return TASKS[index];
}

export function getTaskById(taskId: string): Task | undefined {
  return TASKS.find((task) => task.id === taskId);
}
