import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import DeliveryJob from '../src/models/DeliveryJob.js';
import { validatePickup, groupDropoffs, saveDeliveryJob } from '../src/services/deliveries.js';
import { validCoordinates } from '../src/utils/validation.js';

test('pickup requires ready orders, harvest readiness and compatible dates', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const pickup = new Date('2026-10-03T08:00:00Z');
  const order = { status: 'preparing', requestedDeliveryDate: '2026-10-03', product: { listingType: 'future', harvestStatus: 'ready', harvestDate: '2026-10-02' } };
  assert.doesNotThrow(() => validatePickup([order], pickup, now));
  for (const bad of [
    { ...order, status: 'pending' },
    { ...order, status: 'cancelled' },
    { ...order, requestedDeliveryDate: '2026-10-02' },
    { ...order, product: { ...order.product, harvestStatus: 'growing' } },
    { ...order, product: { ...order.product, harvestStatus: 'delayed' } },
    { ...order, product: { ...order.product, harvestDate: '2026-10-04' } },
  ]) assert.throws(() => validatePickup([bad], pickup, now));
  assert.throws(() => validatePickup([order], now, now));
  assert.throws(() => validatePickup([order], new Date('invalid'), now));
  assert.equal(validCoordinates(6.9, 79.8), true);
  assert.equal(validCoordinates(91, 79.8), false);
  assert.equal(validCoordinates(6.9, NaN), false);
});

test('shared delivery groups orders by buyer and full destination address', () => {
  const address = { addressLine: 'Street', city: 'City', district: 'District', latitude: 6.9, longitude: 79.8 };
  const result = groupDropoffs([
    { _id: '1', buyer: { _id: 'buyer', name: 'Buyer' }, deliveryAddress: address },
    { _id: '2', buyer: { _id: 'buyer', name: 'Buyer' }, deliveryAddress: address },
    { _id: '3', buyer: { _id: 'other', name: 'Other buyer' }, deliveryAddress: address },
  ]);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].orders, ['1', '2']);
  assert.equal(result[0].latitude, 6.9);
  assert.equal(result[1].contactName, 'Other buyer');
});

test('delivery creation rejects orders already claimed by another job and legacy duplicates', async () => {
  const id = new mongoose.Types.ObjectId();
  const session = {};
  const input = { orders: [id], pickupPoints: [{ addressLine: 'Farm', city: 'City', district: 'District' }], scheduledPickupAt: new Date(Date.now() + 3600000) };
  const order = { _id: id, status: 'preparing', product: { listingType: 'current' }, deliveryJob: new mongoose.Types.ObjectId() };
  let legacy = false;
  mock.method(mongoose.connection, 'transaction', async (callback) => callback(session));
  mock.method(Order, 'find', (filter) => { assert.equal(filter.seller, 'farmer'); return { populate() { return this; }, session: async (value) => { assert.equal(value, session); return [order]; } }; });
  mock.method(DeliveryJob, 'exists', () => ({ session: async () => legacy }));
  try {
    await assert.rejects(saveDeliveryJob(input, 'farmer'), /already has a delivery job/);
    delete order.deliveryJob; legacy = true;
    await assert.rejects(saveDeliveryJob(input, 'farmer'), /already has a delivery job/);
  } finally { mock.restoreAll(); }
});
