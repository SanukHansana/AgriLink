import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { loginUser, registerUser } from '@/services/auth-service';
import { api, setApiToken } from '@/services/api';
import type { AuthUser, LoginInput, RegisterInput } from '@/types/auth';
import { writeSession } from '@/services/session-store';
import { setOfflineOwner } from '@/services/offline-driver';
import { stopBackgroundSharing } from '@/services/background-location';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const sessionGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const resetSession = async () => {
      sessionGeneration.current += 1;
      setApiToken(null);
      setOfflineOwner(null);
      try {
        await writeSession(null);
      } catch { /* Login remains required if clearing old storage fails. */ }
      if (active) setUser(null);
      try { await stopBackgroundSharing(); } catch { /* Session reset still completes. */ }
      finally { if (active) setIsRestoring(false); }
    };
    void resetSession(); return () => { active = false; };
  }, []);

  const applyAuthResponse = useCallback(async (token: string, authenticatedUser: AuthUser, generation: number) => {
    await stopBackgroundSharing();
    if (generation !== sessionGeneration.current) return;
    setApiToken(token);
    setOfflineOwner(authenticatedUser.id);
    setUser(authenticatedUser);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true);
      const generation = sessionGeneration.current;
      try {
        const response = await loginUser(input);
        if (generation === sessionGeneration.current) await applyAuthResponse(response.token, response.user, generation);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsLoading(true);
      const generation = sessionGeneration.current;
      try {
        const response = await registerUser(input);
        if (generation === sessionGeneration.current) await applyAuthResponse(response.token, response.user, generation);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    sessionGeneration.current += 1;
    setApiToken(null);
    setOfflineOwner(null);
    setUser(null);
    await writeSession(null).catch(() => {});
    await stopBackgroundSharing().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    const generation = sessionGeneration.current;
    const response = await api.get<{ user: AuthUser }>('/auth/me');
    if (generation === sessionGeneration.current) setUser(response.data.user);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isLoading,
      isRestoring,
      user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, isRestoring, login, logout, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
