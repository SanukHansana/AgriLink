import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { loginUser, registerUser } from '@/services/auth-service';
import { api, setApiToken } from '@/services/api';
import type { AuthUser, LoginInput, RegisterInput } from '@/types/auth';
import { readSession, writeSession } from '@/services/session-store';
import { setOfflineOwner, networkFailure } from '@/services/offline-driver';
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

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await readSession();
        if (!saved || !active) return;
        setApiToken(saved.token); setOfflineOwner(saved.user.id);
        try { const response = await api.get<{ user: AuthUser }>('/auth/me'); if (active) setUser(response.data.user); }
        catch (cause) {
          if (networkFailure(cause)) { if (active) setUser(saved.user); }
          else { setApiToken(null); setOfflineOwner(null); await writeSession(null); await stopBackgroundSharing(); }
        }
      } catch { setApiToken(null); setOfflineOwner(null); }
      finally { if (active) setIsRestoring(false); }
    };
    void restore(); return () => { active = false; };
  }, []);

  const applyAuthResponse = useCallback(async (token: string, authenticatedUser: AuthUser) => {
    await stopBackgroundSharing();
    await writeSession({ token, user: authenticatedUser }).catch(() => {});
    setApiToken(token);
    setOfflineOwner(authenticatedUser.id);
    setUser(authenticatedUser);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true);
      try {
        const response = await loginUser(input);
        await applyAuthResponse(response.token, response.user);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsLoading(true);
      try {
        const response = await registerUser(input);
        await applyAuthResponse(response.token, response.user);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    setApiToken(null);
    setOfflineOwner(null);
    setUser(null);
    await writeSession(null);
    await stopBackgroundSharing();
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await api.get<{ user: AuthUser }>('/auth/me');
    setUser(response.data.user);
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
