import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/types/auth';
export type SavedSession = { token: string; user: AuthUser };
export async function readSession(): Promise<SavedSession | null> {
  const value = await SecureStore.getItemAsync('agrilink-session');
  return value ? JSON.parse(value) : null;
}
export async function writeSession(session: SavedSession | null) {
  if (session) await SecureStore.setItemAsync('agrilink-session', JSON.stringify(session));
  else await SecureStore.deleteItemAsync('agrilink-session');
}
