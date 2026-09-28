import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import ReportedListing from '../src/models/ReportedListing.js';
import { reviewReportedListing } from '../src/controllers/advisory/reportedListingController.js';

const id = '507f1f77bcf86cd799439011';
const officer = { _id: 'officer', role: 'agricultureOfficer', isVerified: true, officerDistrict: 'Kandy' };

function setup(t, overrides = {}, productExists = true) {
  const session = {}, writes = [];
  const report = { product: id, status: 'pending', history: [], ...overrides,
    save: async (options) => { assert.equal(options.session, session); writes.push('report'); }, populate: async () => {} };
  const product = { status: 'active', save: async (options) => { assert.equal(options.session, session); writes.push('product'); } };
  t.mock.method(mongoose.connection, 'transaction', async (callback) => callback(session));
  t.mock.method(ReportedListing, 'findById', () => ({ session: async () => report }));
  t.mock.method(Product, 'findOne', (filter) => {
    assert.equal(filter['farmLocation.district'].test('kandy'), true);
    assert.equal(filter['farmLocation.district'].test('Colombo'), false);
    return { session: async () => productExists ? product : null };
  });
  const result = { status: 200 }, response = { status(code) { result.status = code; return this; }, json(body) { result.body = body; } };
  const run = async (body = { action: 'suspend', reviewNote: 'Verified misleading listing information.' }) => {
    await reviewReportedListing({ params: { reportId: id }, user: officer, body }, response, (error) => { result.error = error; });
    return result;
  };
  return { report, product, writes, run };
}

test('suspending a listing saves product and report in the same transaction and records ownership', async (t) => {
  const { report, product, writes, run } = setup(t);
  const result = await run();
  assert.equal(result.error, undefined); assert.equal(result.status, 200);
  assert.equal(product.status, 'inactive'); assert.equal(report.status, 'suspended');
  assert.equal(report.assignedOfficer, officer._id);
  assert.deepEqual(writes, ['product', 'report']);
  assert.equal(report.history[0].fromStatus, 'pending');
  assert.equal(report.history[0].toStatus, 'suspended');
});

for (const [name, overrides, productExists, message] of [
  ['another officer owns the case', { assignedOfficer: 'other' }, true, /another officer/],
  ['legacy reviewer owns the case', { reviewedBy: 'other' }, true, /another officer/],
  ['case is closed', { status: 'resolved' }, true, /closed/],
  ['listing is outside district', {}, false, /outside/],
]) {
  test(`moderation rejects when ${name} without writing`, async (t) => {
    const { writes, run } = setup(t, overrides, productExists);
    const result = await run();
    assert.match(result.error.message, message); assert.deepEqual(writes, []);
  });
}

test('moderation requires a decision explanation before changing records', async (t) => {
  const { report, writes, run } = setup(t);
  const result = await run({ action: 'dismiss', reviewNote: 'Short' });
  assert.match(result.error.message, /10 characters/);
  assert.equal(report.status, 'pending'); assert.deepEqual(writes, []);
});
