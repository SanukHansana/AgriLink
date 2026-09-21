import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import type { DeliveryJob } from '@/types/logistics';

export type PendingUpdate = { id: string; owner: string; method: 'patch' | 'post'; path: string; data: Record<string, unknown>; createdAt: number; conflict?: string };
let client: AxiosInstance;
let owner: string | null = null;
let syncing = false;
let cached = false;
let storageLock = Promise.resolve();
let deliveryLock: Promise<unknown> = Promise.resolve();
const queueKey = (id: string) => `agrilink-driver-queue:${id}`;
export const networkFailure = (error: unknown) => isAxiosError(error) && !error.response && error.code !== 'ERR_CANCELED';
export const operationId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export function setOfflineOwner(id: string | null) { owner = id; cached = false; }
export function usedOfflineCache() { return cached; }
export async function pendingUpdates(): Promise<PendingUpdate[]> { return owner ? JSON.parse(await AsyncStorage.getItem(queueKey(owner)) ?? '[]') : []; }
async function changeQueue(id: string, change: (items: PendingUpdate[]) => PendingUpdate[]) {
  const task = storageLock.then(async () => { const items = JSON.parse(await AsyncStorage.getItem(queueKey(id)) ?? '[]'); await AsyncStorage.setItem(queueKey(id), JSON.stringify(change(items))); });
  storageLock = task.catch(() => {}); return task;
}

export function installOfflineDriver(api: AxiosInstance) {
  client = api;
  api.interceptors.request.use((config) => { if (owner) config.headers.set('X-AgriLink-Cache-Owner', owner); return config; });
  api.interceptors.response.use(async (response) => {
    const sessionOwner = String(response.config.headers.get('X-AgriLink-Cache-Owner') ?? '');
    if (sessionOwner && sessionOwner === owner && response.config.method === 'get' && response.config.url?.startsWith('/drivers/')) {
      const key = `agrilink-driver-cache:${sessionOwner}:${response.config.url}:${JSON.stringify(response.config.params ?? {})}`;
      await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), data: response.data })).catch(() => {});
      cached = false;
    }
    return response;
  }, async (error) => {
    if (owner && error.config?.headers?.get('X-AgriLink-Cache-Owner') === owner && networkFailure(error) && error.config?.method === 'get' && error.config.url?.startsWith('/drivers/')) {
      const key = `agrilink-driver-cache:${owner}:${error.config.url}:${JSON.stringify(error.config.params ?? {})}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) { const value = JSON.parse(raw); if (Date.now() - value.at < 48 * 3600000) { cached = true; return { data: value.data, status: 200, statusText: 'Offline cache', headers: {}, config: error.config } as AxiosResponse; } }
    }
    throw error;
  });
}

async function updateCachedJob(account: string, jobId: string, change: (job: DeliveryJob) => DeliveryJob) {
  if (owner !== account) return;
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`agrilink-driver-cache:${account}:`));
  for (const key of keys) {
    if (owner !== account) return;
    const raw = await AsyncStorage.getItem(key); if (!raw) continue;
    const entry = JSON.parse(raw);
    if (entry.data.job?._id === jobId) entry.data.job = change(entry.data.job);
    if (entry.data.jobs) entry.data.jobs = entry.data.jobs.map((job: DeliveryJob) => job._id === jobId ? change(job) : job);
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  }
}

export function sendDriverUpdate(method: 'patch' | 'post', path: string, data: Record<string, unknown>): Promise<{ queued: boolean; job?: DeliveryJob }> {
  const account = owner;
  const task = deliveryLock.then(() => {
    if (!account || owner !== account) throw new Error('Sign in with the same account before saving this update');
    return saveDriverUpdate(method, path, data);
  });
  deliveryLock = task.catch(() => {});
  return task;
}

async function saveDriverUpdate(method: 'patch' | 'post', path: string, data: Record<string, unknown>): Promise<{ queued: boolean; job?: DeliveryJob }> {
  const payload = { ...data, operationId: operationId() };
  const account = owner;
  if (!account) throw new Error('Sign in before saving a delivery update');
  // Preserve ordering when earlier stop/status updates are waiting for connectivity.
  const existing = await pendingUpdates();
  if (owner !== account) throw new Error('Account changed before the update was saved');
  if (!existing.length && !syncing) {
    try { return { ...(await client[method](path, payload)).data, queued: false }; }
    catch (error) { if (!networkFailure(error)) throw error; }
  }
  if (owner !== account) throw new Error('Account changed before the update was saved');
  await changeQueue(account, (items) => {
    if (items.length >= 30) throw new Error('Sync the pending delivery updates before saving more');
    return [...items, { id: payload.operationId, owner: account, method, path, data: payload, createdAt: Date.now() }];
  });
  const jobId = path.split('/')[3];
  await updateCachedJob(account, jobId, (job) => {
    if (path.endsWith('/status')) return { ...job, status: data.status as DeliveryJob['status'] };
    if (path.endsWith('/stops')) {
      const field = data.kind === 'pickup' ? 'pickupPoints' : 'dropoffPoints';
      return { ...job, [field]: job[field]?.map((point, index) => index === data.index ? { ...point, completedAt: new Date().toISOString(), outcome: data.outcome ?? 'delivered' } : point) };
    }
    if (data.action === 'return') return { ...job, dropoffPoints: job.dropoffPoints?.map((point, index) => index === data.index ? { ...point, returnCompletedAt: new Date().toISOString() } : point) };
    return job;
  });
  return { queued: true };
}

export async function syncDriverUpdates() {
  const account = owner; if (!account || syncing) return;
  syncing = true;
  try {
    for (const item of await pendingUpdates()) {
      if (owner !== account || item.conflict) break;
      if (Date.now() - item.createdAt > 48 * 3600000) {
        await changeQueue(account, (items) => items.map((entry) => entry.id === item.id ? { ...entry, conflict: 'This update is over 48 hours old. Review it before retrying.' } : entry)); break;
      }
      try { await client[item.method](item.path, item.data); await changeQueue(account, (items) => items.filter((entry) => entry.id !== item.id)); }
      catch (error) {
        if (!networkFailure(error)) await changeQueue(account, (items) => items.map((entry) => entry.id === item.id ? { ...entry, conflict: isAxiosError(error) ? error.response?.data?.message ?? 'Server rejected the update' : 'Update failed' } : entry));
        break;
      }
    }
  } finally { syncing = false; }
}

export async function reviewPending(id: string, remove: boolean) {
  if (owner) await changeQueue(owner, (items) => remove ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, conflict: undefined, createdAt: Date.now() } : item));
}
