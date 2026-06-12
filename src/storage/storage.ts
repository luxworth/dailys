import AsyncStorage from '@react-native-async-storage/async-storage';
import { GHOST_SUBMISSION } from '../types/prefs';
import { AppState, DayEntry } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { getTaskForDate } from '../utils/taskUtils';

const STORAGE_KEY = '@dailys/app_state';

const EMPTY_STATE: AppState = { entries: {} };

export async function loadAppState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_STATE };
    }
    const parsed = JSON.parse(raw) as AppState;
    return {
      entries: parsed.entries ?? {},
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createPendingEntry(date: string): DayEntry {
  const task = getTaskForDate(date);
  return {
    date,
    taskId: task.id,
    status: 'PENDING',
  };
}

export function reconcileExpiredDays(state: AppState, today: string = getLocalDateString()): AppState {
  const entries = { ...state.entries };
  const dates = Object.keys(entries).sort();

  for (const date of dates) {
    if (date >= today) {
      continue;
    }
    const entry = entries[date];
    if (entry.status === 'PENDING') {
      entries[date] = { ...entry, status: 'FAILED' };
    }
  }

  if (!entries[today]) {
    entries[today] = createPendingEntry(today);
  }

  return { entries };
}

export async function submitToday(
  state: AppState,
  submission: string,
  today: string = getLocalDateString()
): Promise<AppState> {
  const entry = state.entries[today] ?? createPendingEntry(today);

  if (entry.status !== 'PENDING') {
    return state;
  }

  const nextState: AppState = {
    entries: {
      ...state.entries,
      [today]: {
        ...entry,
        status: 'SUBMITTED',
        submission,
        submittedAt: new Date().toISOString(),
      },
    },
  };

  await saveAppState(nextState);
  return nextState;
}

export async function deployGhostToday(
  state: AppState,
  today: string = getLocalDateString()
): Promise<AppState> {
  const entry = state.entries[today] ?? createPendingEntry(today);

  if (entry.status !== 'PENDING' && entry.status !== 'FAILED') {
    return state;
  }

  const nextState: AppState = {
    entries: {
      ...state.entries,
      [today]: {
        ...entry,
        status: 'SUBMITTED',
        submission: GHOST_SUBMISSION,
        submittedAt: new Date().toISOString(),
      },
    },
  };

  await saveAppState(nextState);
  return nextState;
}

export async function initializeAppState(): Promise<AppState> {
  const loaded = await loadAppState();
  const reconciled = reconcileExpiredDays(loaded);
  await saveAppState(reconciled);
  return reconciled;
}

export function getEntryForDate(state: AppState, date: string): DayEntry {
  return state.entries[date] ?? createPendingEntry(date);
}
