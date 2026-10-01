import assert from 'node:assert/strict';
import { test } from 'node:test';
import Notice from '../src/models/Notice.js';
import User from '../src/models/User.js';
import FarmerProfile from '../src/models/FarmerProfile.js';
import Notification from '../src/models/Notification.js';
import { broadcastNotice, processNotices } from '../src/services/notice-scheduling.js';

test('notice fanout targets active district farmers, batches recipients and uses stable retry keys', async (t) => {
  const batches = [], cleared = [];
  t.mock.method(FarmerProfile, 'find', (filter) => {
    assert.equal(filter['farmLocation.district'].test('kandy (east)'), true);
    assert.equal(filter['farmLocation.district'].test('Kandy East'), false);
    return { distinct: async () => ['farmer-1'] };
  });
  t.mock.method(User, 'find', (filter) => {
    assert.deepEqual(filter, { role: 'farmer', isActive: true, _id: { $in: ['farmer-1'] } });
    return { select: () => ({ cursor: async function* () {
      for (let index = 0; index < 205; index++) yield { _id: `farmer-${index}` };
    } }) };
  });
  t.mock.method(Notification, 'bulkWrite', async (batch) => { batches.push(batch); });
  t.mock.method(Notice, 'updateOne', async (...args) => { cleared.push(args); });
  const notice = { _id: 'notice-1', targetAudience: 'district', targetDistrict: 'Kandy (East)', title: 'Weather warning', isEmergency: true };
  await broadcastNotice(notice);
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 5]);
  const operation = batches[0][0].updateOne;
  assert.deepEqual(operation.filter, { user: 'farmer-0', eventKey: 'notice:notice-1' });
  assert.equal(operation.upsert, true);
  assert.match(operation.update.$setOnInsert.message, /Emergency notice: Weather warning/);
  await broadcastNotice(notice);
  assert.deepEqual(batches[3][0].updateOne.filter, operation.filter);
  assert.equal(cleared.length, 2);
  assert.deepEqual(cleared[0][1], { $set: { notificationPending: false } });
});

test('failed fanout leaves the notice pending for retry', async (t) => {
  t.mock.method(User, 'find', () => ({ select: () => ({ cursor: async function* () { yield { _id: 'farmer' }; } }) }));
  t.mock.method(Notification, 'bulkWrite', async () => { throw new Error('Database unavailable'); });
  const cleared = t.mock.method(Notice, 'updateOne', async () => {});
  await assert.rejects(broadcastNotice({ _id: 'notice', targetAudience: 'allFarmers', title: 'Alert' }), /Database unavailable/);
  assert.equal(cleared.mock.callCount(), 0);
});

test('worker archives expired notices and publishes only authorized scheduled notices', async (t) => {
  const now = new Date('2026-09-28T06:00:00Z'), updates = [];
  const archive = t.mock.method(Notice, 'updateMany', async (filter, mutation) => {
    assert.deepEqual(filter.expiresAt, { $lte: now, $ne: null });
    assert.equal(mutation.$set.status, 'archived');
  });
  t.mock.method(Notice, 'find', (filter) => {
    assert.deepEqual(filter.$or, [{ expiresAt: null }, { expiresAt: { $gt: now } }]);
    return { limit: async () => filter.status === 'scheduled' ? [
      { _id: 'allowed', officer: 'verified', targetAudience: 'district', targetDistrict: 'kandy' },
      { _id: 'wrong-district', officer: 'verified', targetAudience: 'district', targetDistrict: 'Colombo' },
      { _id: 'unverified', officer: 'unverified', targetAudience: 'allFarmers' },
      { _id: 'unassigned', officer: 'unassigned', targetAudience: 'allFarmers' },
    ] : [] };
  });
  t.mock.method(User, 'findOne', async (filter) => {
    assert.equal(filter.isActive, true); assert.equal(filter.isVerified, true);
    return filter._id === 'verified' ? { officerDistrict: 'Kandy' } : filter._id === 'unassigned' ? {} : null;
  });
  t.mock.method(Notice, 'updateOne', async (filter, mutation) => { updates.push({ filter, mutation }); });
  await processNotices(now);
  assert.equal(archive.mock.callCount(), 1);
  assert.deepEqual(updates, [{ filter: { _id: 'allowed', status: 'scheduled' }, mutation: { $set: { status: 'published', publishedAt: now, notificationPending: true } } }]);
});
