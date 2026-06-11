import { useCallback, useEffect, useState } from 'react';
import { AppState, CompletionStatus } from '../types';
import { initializeAppState } from '../storage/storage';
import { getLocalDateString } from '../utils/dateUtils';
import { calculateStreak, getHistoryDays } from '../utils/streakUtils';

interface HistoryDay {
  date: string;
  status: CompletionStatus | 'NONE';
}

interface HistoryState {
  loading: boolean;
  streak: number;
  days: HistoryDay[];
  refresh: () => Promise<void>;
}

export function useHistory(): HistoryState {
  const [appState, setAppState] = useState<AppState>({ entries: {} });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const state = await initializeAppState();
    setAppState(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = getLocalDateString();
  const streak = calculateStreak(appState.entries, today);
  const days = getHistoryDays(appState.entries, 30);

  return {
    loading,
    streak,
    days,
    refresh: load,
  };
}
