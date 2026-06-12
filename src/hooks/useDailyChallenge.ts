import { useCallback, useEffect, useState } from 'react';
import { AppState, CompletionStatus, DayEntry, Task } from '../types';
import {
  getEntryForDate,
  initializeAppState,
  reconcileExpiredDays,
  saveAppState,
  submitToday,
} from '../storage/storage';
import { getLocalDateString } from '../utils/dateUtils';
import { calculateStreak } from '../utils/streakUtils';
import { getTaskById, getTaskForDate } from '../utils/taskUtils';

interface DailyChallengeState {
  loading: boolean;
  today: string;
  task: Task;
  entry: DayEntry;
  status: CompletionStatus;
  streak: number;
  refresh: () => Promise<void>;
  submit: (value: string) => Promise<boolean>;
}

export function useDailyChallenge(): DailyChallengeState {
  const [appState, setAppState] = useState<AppState>({ entries: {} });
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(getLocalDateString());

  const load = useCallback(async () => {
    const currentToday = getLocalDateString();
    setToday(currentToday);
    const state = await initializeAppState();
    setAppState(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    const currentToday = getLocalDateString();
    if (currentToday !== today) {
      setToday(currentToday);
    }
    const reconciled = reconcileExpiredDays(appState, currentToday);
    if (JSON.stringify(reconciled) !== JSON.stringify(appState)) {
      await saveAppState(reconciled);
      setAppState(reconciled);
    }
  }, [appState, today]);

  const submit = useCallback(
    async (value: string): Promise<boolean> => {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }
      const nextState = await submitToday(appState, trimmed, today);
      setAppState(nextState);
      return true;
    },
    [appState, today]
  );

  const entry = getEntryForDate(appState, today);
  const task = getTaskById(entry.taskId) ?? getTaskForDate(today);
  const streak = calculateStreak(appState.entries, today);

  return {
    loading,
    today,
    task,
    entry,
    status: entry.status,
    streak,
    refresh,
    submit,
  };
}
