export type TaskType = 'NUMBER' | 'TEXT' | 'IMAGE';

export interface DailyTask {
  id: string; // Typically YYYY-MM-DD
  date: string; // ISO string
  title: string;
  type: TaskType;
  status: 'PENDING' | 'SUBMITTED' | 'FAILED';
  submission?: string | number; // Value, text, or image URI
  completedAt?: number; // Timestamp
}

export type ThemeId = 'typewriter-ritual' | 'arcade-ledger' | 'field-notes' | 'analog-static' | 'industrial';

export interface AppState {
  currentTab: 'DAILY' | 'FEED' | 'SQUADS' | 'HISTORY' | 'SETTINGS';
  streak: number;
}
