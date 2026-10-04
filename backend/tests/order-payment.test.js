import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import { requireOrderPayment, validateDemoPayment } from '../src/services/order-payment.js';
import { payBuyerOrder, receiveBuyerOrder } from '../src/controllers/buyer/orderController.js';
import { updateFarmerOrderStatus } from '../src/controllers/farmer/orderController.js';
test('unpaid and legacy orders cannot progress into preparation or pickup', () => {
  assert.throws(() => requireOrderPayment({}), /must pay/);
  assert.throws(() => requireOrderPayment({ paymentStatus: 'unpaid' }), /must pay/);
  assert.doesNotThrow(() => requireOrderPayment({ paymentStatus: 'paid' }));
});
test('demo payment validates expiry and is disabled in production', () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'test';
    const card = { provider: 'mock', last4: '4242', expiry: '12/39' };
    assert.doesNotThrow(() => validateDemoPayment(card));
    assert.throws(() => validateDemoPayment({ ...card, expiry: '01/20' }));
    assert.throws(() => validateDemoPayment({ ...card, last4: '1234' }));
    process.env.NODE_ENV = 'production';
    assert.throws(() => validateDemoPayment(card), /disabled/);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
test('order payment is owner-scoped and waits for farmer acceptance', async () => {
  let error;
  mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.buyer, 'buyer'); assert.equal(filter.status, 'confirmed');
    assert.equal(update.$set.paymentStatus, 'paid');
    assert.equal(JSON.stringify(update).includes('4242'), false); return null;
  });
  mock.method(Order, 'findOne', async () => null);
  try {
    await payBuyerOrder({ params: { orderId: String(new mongoose.Types.ObjectId()) }, user: { _id: 'buyer' }, body: { provider: 'mock', last4: '4242', expiry: '12/39' } }, {}, (cause) => { error = cause; });
    assert.match(error.message, /farmer to accept/);
  } finally { mock.restoreAll(); }
});
test('receipt is buyer-scoped and requires driver delivery', async () => {
  let error;
  mock.method(Order, 'findOneAndUpdate', async (filter) => { assert.equal(filter.buyer, 'buyer'); assert.equal(filter.status, 'delivered'); return null; });
  mock.method(Order, 'findOne', async () => null);
  try {
    await receiveBuyerOrder({ params: { orderId: String(new mongoose.Types.ObjectId()) }, user: { _id: 'buyer' } }, {}, (cause) => { error = cause; });
    assert.match(error.message, /driver records delivery/);
  } finally { mock.restoreAll(); }
});
test('farmer cannot save a preparation status before payment', async () => {
  let error; let saved = false;
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(Order, 'findOne', () => ({ session: async () => ({ status: 'confirmed', paymentStatus: 'unpaid', save: async () => { saved = true; } }) }));
  try {
    await updateFarmerOrderStatus({ params: { orderId: String(new mongoose.Types.ObjectId()) }, body: { status: 'preparing' }, user: { _id: 'farmer' } }, {}, (cause) => { error = cause; });
    assert.match(error.message, /must pay/); assert.equal(saved, false);
  } finally { mock.restoreAll(); }
});
