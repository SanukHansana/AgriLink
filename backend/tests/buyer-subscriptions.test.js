import assert from 'node:assert/strict';
import { test } from 'node:test';
import User from '../src/models/User.js';
import Bid from '../src/models/Bid.js';
import Product from '../src/models/Product.js';
import Notification from '../src/models/Notification.js';
import { hasOutbidSubscription, notifyOutbidBuyers, mockSubscriptionsEnabled } from '../src/services/buyer-subscriptions.js';
import { changeSubscription } from '../src/controllers/buyer/subscriptionController.js';

test('outbid entitlement excludes expired, cancelled, inactive and nonbuyer accounts', () => {
  const now = new Date('2026-10-02T00:00:00Z');
  const buyer = { role: 'buyer', isActive: true, buyerSubscription: { status: 'active', expiresAt: '2026-10-03' } };
  assert.equal(hasOutbidSubscription(buyer, now), true);
  assert.equal(hasOutbidSubscription({ ...buyer, role: 'farmer' }, now), false);
  assert.equal(hasOutbidSubscription({ ...buyer, isActive: false }, now), false);
  for (const subscription of [{ status: 'cancelled', expiresAt: '2026-10-03' }, { status: 'active', expiresAt: now }, { status: 'active', expiresAt: 'invalid' }])
    assert.equal(hasOutbidSubscription({ ...buyer, buyerSubscription: subscription }, now), false);
});

test('outbid fanout filters lower active bids and subscribed buyers with stable event keys', async (t) => {
  t.mock.method(Product, 'findById', async () => ({ name: 'Rice', status: 'active', biddingClosesAt: new Date(Date.now() + 86400000) }));
  t.mock.method(Bid, 'find', (filter) => {
    assert.equal(filter.buyer.$ne, 'new-buyer'); assert.deepEqual(filter.bidAmount, { $lt: 150 });
    assert.equal(filter.status, 'active'); assert.equal(filter.unit, 'kg');
    return { distinct: async () => ['subscribed', 'free'] };
  });
  t.mock.method(User, 'find', async (filter) => {
    assert.equal(filter['buyerSubscription.status'], 'active');
    assert.ok(filter['buyerSubscription.expiresAt'].$gt instanceof Date);
    return [{ _id: 'subscribed', role: 'buyer', buyerSubscription: { status: 'active', expiresAt: new Date(Date.now() + 86400000) } }, { _id: 'free', role: 'buyer' }];
  });
  const notify = t.mock.method(Notification, 'updateOne', async () => {});
  const bid = { _id: 'bid', product: 'product', buyer: 'new-buyer', unit: 'kg', bidAmount: 150, updatedAt: new Date('2026-10-02') };
  await notifyOutbidBuyers(bid);
  assert.equal(notify.mock.callCount(), 1);
  assert.deepEqual(notify.mock.calls[0].arguments[0], { user: 'subscribed', eventKey: 'outbid:bid:2026-10-02T00:00:00.000Z' });
});

test('closed listings do not send outbid alerts', async (t) => {
  t.mock.method(Product, 'findById', async () => ({ status: 'active', biddingClosesAt: new Date(0) }));
  const query = t.mock.method(Bid, 'find', () => { throw new Error('Must not query'); });
  await notifyOutbidBuyers({ product: 'product' });
  assert.equal(query.mock.callCount(), 0);
});

test('mock billing cannot activate in production', async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(mockSubscriptionsEnabled(), false);
    let status;
    await changeSubscription({ body: { action: 'subscribe' } }, { status(code) { status = code; return this; }, json() {} }, (error) => { throw error; });
    assert.equal(status, 503);
  } finally { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; }
});
