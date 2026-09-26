import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateVisitChange } from '../src/controllers/advisory/fieldVisitController.js';

test('visit completion needs findings and schedules cannot be moved into the past', () => {
  const now = new Date('2026-10-12T00:00:00Z');
  assert.throws(() => validateVisitChange({ action: 'complete', findings: 'Short' }, now), /findings/);
  assert.throws(() => validateVisitChange({ action: 'reschedule', scheduledAt: '2026-10-01' }, now), /future/);
  assert.throws(() => validateVisitChange({ action: 'complete', findings: 'Soil inspected and recommendations provided.', followUpAt: 'invalid' }, now), /future/);
  const result = validateVisitChange({ action: 'complete', findings: 'Soil inspected and recommendations provided.', followUpAt: '2026-10-20T09:30:00+05:30' }, now);
  assert.ok(result.followUp instanceof Date);
});
