import type { AuthUser } from '@/types/auth';
export type SavedSession = { token: string; user: AuthUser };
export async function readSession(): Promise<SavedSession | null> {
  if (typeof sessionStorage === 'undefined') return null;
  const value = sessionStorage.getItem('agrilink-session');
  return value ? JSON.parse(value) : null;
}
export async function writeSession(session: SavedSession | null) {
  if (typeof sessionStorage === 'undefined') return;
  if (session) sessionStorage.setItem('agrilink-session', JSON.stringify(session));
  else sessionStorage.removeItem('agrilink-session');
}
