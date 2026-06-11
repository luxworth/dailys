export type TaskType = 'NUMBER' | 'IMAGE' | 'TEXT';

export type CompletionStatus = 'PENDING' | 'SUBMITTED' | 'FAILED';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  placeholder?: string;
}

export interface DayEntry {
  date: string;
  taskId: string;
  status: CompletionStatus;
  submission?: string;
  submittedAt?: string;
}

export interface AppState {
  entries: Record<string, DayEntry>;
}
