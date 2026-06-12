import { useCallback, useEffect, useState } from 'react';
import { UserPrefs } from '../types/prefs';
import { completeOnboarding, loadUserPrefs } from '../storage/prefsStorage';

export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);

  const load = useCallback(async () => {
    const next = await loadUserPrefs();
    setPrefs(next);
    return next;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const finishOnboarding = useCallback(async () => {
    const next = await completeOnboarding();
    setPrefs(next);
    return next;
  }, []);

  return {
    prefs,
    ready: prefs !== null,
    finishOnboarding,
    reload: load,
  };
}
