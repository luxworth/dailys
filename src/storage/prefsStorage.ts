import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GHOSTS, UserPrefs } from '../types/prefs';

const PREFS_KEY = '@dailys/prefs';

const DEFAULT_PREFS: UserPrefs = {
  onboarded: false,
  ghostsRemaining: DEFAULT_GHOSTS,
};

export async function loadUserPrefs(): Promise<UserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    return {
      onboarded: parsed.onboarded ?? false,
      ghostsRemaining: parsed.ghostsRemaining ?? DEFAULT_GHOSTS,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveUserPrefs(prefs: UserPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function completeOnboarding(): Promise<UserPrefs> {
  const prefs = await loadUserPrefs();
  const next = { ...prefs, onboarded: true };
  await saveUserPrefs(next);
  return next;
}

export async function consumeGhostToken(): Promise<UserPrefs | null> {
  const prefs = await loadUserPrefs();
  if (prefs.ghostsRemaining <= 0) {
    return null;
  }
  const next = { ...prefs, ghostsRemaining: prefs.ghostsRemaining - 1 };
  await saveUserPrefs(next);
  return next;
}
