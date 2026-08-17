import { api } from '@/services/api';
import type { AuthResponse, LoginInput, RegisterInput } from '@/types/auth';

export async function loginUser(input: LoginInput) {
  const response = await api.post<AuthResponse>('/auth/login', input);
  return response.data;
}

export async function registerUser(input: RegisterInput) {
  const response = await api.post<AuthResponse>('/auth/register', input);
  return response.data;
}
