import assert from 'node:assert/strict';
import { test } from 'node:test';
import { errorHandler } from '../src/middleware/errorMiddleware.js';

test('oversized upload returns actionable JSON instead of an authentication error', () => {
  let status, body;
  errorHandler({ type: 'entity.too.large' }, {}, { status(value) { status = value; return this; }, json(value) { body = value; } }, () => {});
  assert.equal(status, 413);
  assert.match(body.message, /Crop the photo/);
});
