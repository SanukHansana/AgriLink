import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { api, getApiToken } from '@/services/api';
import { operationId } from './offline-driver';

const TASK = 'agrilink-active-delivery-location';
const KEY = 'agrilink-background-location';
export function supportsBackgroundLocation() {
  return Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
type Settings = { jobId: string; token: string; baseUrl: string; sessionId: string; expiresAt: number };
async function settings(): Promise<Settings | null> { const raw = await SecureStore.getItemAsync(KEY); return raw ? JSON.parse(raw) : null; }

async function locationRequest(saved: Settings, body: object) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(`${saved.baseUrl}/drivers/jobs/${saved.jobId}/location`, { method: 'PATCH', signal: controller.signal, headers: { Authorization: `Bearer ${saved.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } finally { clearTimeout(timer); }
}

TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (error) return;
  const saved = await settings();
  if (!saved || saved.expiresAt < Date.now()) { await stopBackgroundSharing(); return; }
  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  const point = locations?.[locations.length - 1];
  if (!point || Date.now() - point.timestamp > 120000) return;
  try {
    const response = await locationRequest(saved, { sessionId: saved.sessionId, latitude: point.coords.latitude, longitude: point.coords.longitude });
    if ([401, 403, 404, 409].includes(response.status)) await stopBackgroundSharing();
  } catch { /* Keep watching; only current positions are sent after reconnection. */ }
});

export async function backgroundSharingJob() {
  if (!supportsBackgroundLocation()) return null;
  const saved = await settings();
  if (saved && saved.expiresAt < Date.now()) { await stopBackgroundSharing(); return null; }
  return saved?.jobId ?? null;
}
export async function stopBackgroundSharing() {
  if (Platform.OS === 'web') return;
  const saved = await settings();
  // Delete credentials first so an already running callback cannot start another update.
  await SecureStore.deleteItemAsync(KEY);
  if (supportsBackgroundLocation() && await Location.hasStartedLocationUpdatesAsync(TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(TASK);
  if (saved) await locationRequest(saved, { sharing: false, sessionId: saved.sessionId }).catch(() => {});
}

export async function startBackgroundSharing(jobId: string) {
  if (!supportsBackgroundLocation() || !await TaskManager.isAvailableAsync()) throw new Error('Background tracking requires a native development or production build. Foreground sharing still works.');
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') throw new Error('Allow location access first');
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') throw new Error('Background location permission was not granted');
  const token = getApiToken(); if (!token) throw new Error('Sign in again before sharing');
  await stopBackgroundSharing();
  const saved = { jobId, token, sessionId: operationId(), baseUrl: api.defaults.baseURL!, expiresAt: Date.now() + 12 * 3600000 };
  await api.patch(`/drivers/jobs/${jobId}/location`, { start: true, sessionId: saved.sessionId });
  await SecureStore.setItemAsync(KEY, JSON.stringify(saved));
  try { await Location.startLocationUpdatesAsync(TASK, { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 20, pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true, foregroundService: { notificationTitle: 'AgriLink delivery location', notificationBody: 'Your location is shared with this delivery’s farmer and buyers.', killServiceOnDestroy: true } }); }
  catch (error) { await stopBackgroundSharing(); throw error; }
}
