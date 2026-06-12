import { useCallback, useEffect, useState } from 'react';

import { getUserHistory } from '../api/history';
import { mapHistoryDayStatus } from '../api/statusMap';
import { CompletionStatus } from '../types';
import { TraceEntry } from '../utils/traceUtils';
import { useAuth } from '../context/AuthContext';

interface HistoryDay {
  date: string;
  status: CompletionStatus | 'NONE';
}

interface HistoryState {
  loading: boolean;
  streak: number;
  days: HistoryDay[];
  trace: TraceEntry[];
  refresh: () => Promise<void>;
}

export function useHistory(): HistoryState {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([]);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const history = await getUserHistory();
      setStreak(history.streak);
      setDays(
        history.days.map((day) => ({
          date: day.date,
          status: mapHistoryDayStatus(day.status),
        }))
      );
      setTrace(
        history.trace.map((entry) => ({
          date: entry.date,
          title: entry.title,
          type: entry.task_type,
          submission: entry.submission_preview,
        }))
      );
    } catch {
      setStreak(0);
      setDays([]);
      setTrace([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    streak,
    days,
    trace,
    refresh: load,
  };
}
