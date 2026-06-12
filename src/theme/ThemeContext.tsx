import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { resolveThemeId, Theme, ThemeId, THEMES } from './themes';

const THEME_STORAGE_KEY = '@dailys/theme';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => Promise<void>;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('industrial');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        setThemeId(resolveThemeId(stored));
      })
      .finally(() => setReady(true));
  }, []);

  const setTheme = useCallback(async (id: ThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      theme: THEMES[themeId],
      themeId,
      setTheme,
      ready,
    }),
    [themeId, setTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
