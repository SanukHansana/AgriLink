import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { loginUser, registerUser } from '@/services/auth-service';
import { setApiToken } from '@/services/api';
import type { AuthUser, LoginInput, RegisterInput } from '@/types/auth';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const applyAuthResponse = useCallback((token: string, authenticatedUser: AuthUser) => {
    setApiToken(token);
    setUser(authenticatedUser);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true);
      try {
        const response = await loginUser(input);
        applyAuthResponse(response.token, response.user);
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
        applyAuthResponse(response.token, response.user);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const logout = useCallback(() => {
    setApiToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isLoading,
      user,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, user],
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
