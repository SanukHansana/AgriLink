import PushDevice from '../models/PushDevice.js';
import { notificationText } from './notification-language.js';
export const validPushToken = (token) => typeof token === 'string' && /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/.test(token);
async function expoRequest(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  const response = await fetch(`https://exp.host/--/api/v2/push/${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Expo push service returned ${response.status}`);
  return response.json();
}
export async function sendPhoneNotification(user, message, eventKey) {
  const devices = await PushDevice.find({ user }).lean();
  for (let index = 0; index < devices.length; index += 100) {
    const batch = devices.slice(index, index + 100);
    const result = await expoRequest('send', batch.map(({ token, language }) => ({ to: token, title: 'AgriLink', body: notificationText(message, language), sound: 'default', channelId: 'agrilink', data: { eventKey, screen: 'notifications' } })));
    const receipts = new Map();
    for (const [i, ticket] of (result.data ?? []).entries()) {
      if (ticket.details?.error === 'DeviceNotRegistered') await PushDevice.deleteOne({ token: batch[i].token, user });
      else if (ticket.status === 'ok' && ticket.id) receipts.set(ticket.id, batch[i].token);
      else console.error('Expo push ticket failed:', ticket.details?.error ?? 'Unknown error');
    }
    if (receipts.size) {
      const timer = setTimeout(async () => {
        try {
          const response = await expoRequest('getReceipts', { ids: [...receipts.keys()] });
          for (const [id, receipt] of Object.entries(response.data ?? {})) {
            if (receipt.details?.error === 'DeviceNotRegistered') await PushDevice.deleteOne({ token: receipts.get(id), user });
            else if (receipt.status === 'error') console.error('Expo push receipt failed:', receipt.details?.error ?? 'Unknown error');
          }
        } catch (error) { console.error('Unable to check push receipts:', error.message); }
      }, 15 * 60 * 1000);
      timer.unref();
    }
  }
}
