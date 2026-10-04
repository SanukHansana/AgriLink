import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import PushDevice from '../src/models/PushDevice.js';
import Notification from '../src/models/Notification.js';
import { validPushToken, sendPhoneNotification } from '../src/services/push-notifications.js';
import { notify } from '../src/services/notifications.js';
test('push token validation rejects arbitrary URLs and invalid tokens', () => {
  assert.equal(validPushToken('ExpoPushToken[abcdefghij123]'), true);
  assert.equal(validPushToken('ExponentPushToken[abcdefghij123]'), true);
  assert.equal(validPushToken('https://example.com'), false);
  assert.equal(validPushToken(null), false);
});
test('push delivery targets recipient devices and removes unregistered tokens', async () => {
  const token = 'ExpoPushToken[abcdefghij123]';
  mock.method(PushDevice, 'find', (filter) => { assert.equal(filter.user, 'buyer'); return { lean: async () => [{ token }] }; });
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://exp.host/--/api/v2/push/send');
    const payload = JSON.parse(options.body)[0];
    assert.equal(payload.to, token); assert.equal(payload.body, 'Outbid'); assert.equal(payload.channelId, 'agrilink');
    return { ok: true, json: async () => ({ data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] }) };
  });
  let deleted;
  mock.method(PushDevice, 'deleteOne', async (filter) => { deleted = filter; });
  try { await sendPhoneNotification('buyer', 'Outbid', 'event'); assert.deepEqual(deleted, { token, user: 'buyer' }); }
  finally { mock.restoreAll(); }
});
test('duplicate notification events do not send another phone alert', async () => {
  mock.method(Notification, 'updateOne', async () => ({ upsertedCount: 0 }));
  mock.method(PushDevice, 'find', () => { throw new Error('Duplicate event reached push sender'); });
  try { await notify('buyer', 'Outbid', 'event'); assert.equal(PushDevice.find.mock.callCount(), 0); }
  finally { mock.restoreAll(); }
});

test('system push text uses Sinhala/Tamil and preserves product names and order codes', async () => {
  const { notificationText } = await import('../src/services/notification-language.js');
  const alert = 'You have been outbid on Rabu. Another buyer offered LKR 200 per kg. Open My Bids to revise your offer.';
  assert.match(notificationText(alert, 'si'), /Rabu/);
  assert.match(notificationText(alert, 'ta'), /200/);
  assert.match(notificationText('Order AG-123 is preparing.', 'ta'), /ஆர்டர் AG-123/);
  assert.equal(notificationText(alert, 'en'), alert);
  assert.equal(notificationText('Farmer-written message', 'si'), 'Farmer-written message');
});
