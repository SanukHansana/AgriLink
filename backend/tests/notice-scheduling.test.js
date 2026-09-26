import assert from 'node:assert/strict';
import { test } from 'node:test';
import { liveNoticeFilter, validateNoticeSchedule } from '../src/services/notice-scheduling.js';

test('notice schedules reject invalid dates and expiration before publishing', () => {
  const now = new Date('2026-09-26T00:00:00Z');
  for (const value of ['invalid', '2026-09-25T00:00:00Z']) {
    assert.throws(() => validateNoticeSchedule({ scheduledPublishAt: value }, now), /future/);
  }
  assert.throws(() => validateNoticeSchedule({ scheduledPublishAt: '2026-09-28T00:00:00Z', expiresAt: '2026-09-27T00:00:00Z' }, now), /after/);
  const data = { scheduledPublishAt: '2026-09-27T09:00:00+05:30', expiresAt: '2026-09-28T09:00:00+05:30' };
  validateNoticeSchedule(data, now);
  assert.equal(data.scheduledPublishAt.toISOString(), '2026-09-27T03:30:00.000Z');
  assert.deepEqual(liveNoticeFilter(now), { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  const cleared = { expiresAt: '' };
  validateNoticeSchedule(cleared, now);
  assert.equal(cleared.expiresAt, null);
});
