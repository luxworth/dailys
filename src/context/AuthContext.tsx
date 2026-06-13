import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getMe, loginUser, logoutUser, registerUser } from '../api/auth';
import { updatePushToken } from '../api/users';
import { getRefreshToken } from '../api/tokenStorage';
import { LoginRequest, RegisterRequest, UserPublic } from '../api/types';
import { registerForPushNotificationsAsync } from '../notifications/pushNotifications';

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterRequest) => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const refresh = await getRefreshToken();
    if (!refresh) {
      setLoading(false);
      return;
    }

    try {
      const me = await getMe();
      setUser(me);
    } catch {
      await logoutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        return;
      }
      try {
        await updatePushToken(token);
      } catch {
        // Push registration is best-effort; squads still work without it.
      }
    })();
  }, [user]);

  const register = useCallback(async (payload: RegisterRequest) => {
    await registerUser(payload);
    const me = await getMe();
    setUser(me);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    await loginUser(payload);
    const me = await getMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      register,
      login,
      logout,
    }),
    [user, loading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
