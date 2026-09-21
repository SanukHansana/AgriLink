import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import DeliveryJob from '../src/models/DeliveryJob.js';
import DriverProfile from '../src/models/DriverProfile.js';
import Notification from '../src/models/Notification.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import { validLicence, validateProof, changeAssignment, returnStop } from '../src/services/driver-workflows.js';
import { planRoute } from '../src/services/route-planning.js';

const proof = { photoData: 'data:image/jpeg;base64,abc', receiverName: 'Receiver', receiverSignature: 'Confirmed' };
test('licence expiry uses the Sri Lankan date and proof requires image and recipient confirmation', () => {
  const now = new Date('2026-10-12T20:00:00Z');
  assert.equal(validLicence('2026-10-12', now), false);
  assert.equal(validLicence('2026-10-13', now), true);
  assert.equal(validLicence('invalid', now), false);
  assert.throws(() => validateProof({ ...proof, photoData: '' }));
  assert.throws(() => validateProof({ ...proof, receiverSignature: '' }));
  assert.doesNotThrow(() => validateProof(proof));
});

test('driver release cannot abandon collected cargo; admin release keeps resumable trip state', async () => {
  const job = { _id: 'job', createdBy: 'farmer', assignedDriver: 'driver', status: 'inTransit', pickupPoints: [{ completedAt: new Date() }], assignmentHistory: [], updatedAt: new Date(), save: async () => {} };
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(DeliveryJob, 'findOne', (filter) => { if (filter.assignedDriver) assert.equal(filter.assignedDriver, 'driver'); return { session: async () => job }; });
  mock.method(DriverProfile, 'updateOne', async () => ({}));
  mock.method(Notification, 'updateOne', async () => ({}));
  try {
    await assert.rejects(changeAssignment('job', 'driver', 'release', 'Vehicle broke down'), /Cargo has been collected/);
    assert.equal(job.assignedDriver, 'driver');
    await changeAssignment('job', 'admin', 'release', 'Cargo transfer confirmed', true);
    assert.equal(job.status, 'available'); assert.equal(job.resumeStatus, 'inTransit'); assert.equal(job.assignedDriver, undefined);
    assert.equal(job.assignmentHistory[0].driver, 'driver');
  } finally { mock.restoreAll(); }
});

test('partial return restocks only undelivered quantity and rejects repeated return', async () => {
  const order = { quantity: 10, product: 'product', stockReserved: true, save: async () => {} };
  const product = { availableQuantity: 0, status: 'sold', save: async () => {} };
  const point = { orders: ['order'], outcome: 'partial', deliveredQuantities: [{ order: 'order', quantity: 4 }] };
  const job = { status: 'inTransit', dropoffPoints: [point], save: async () => {} };
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(DeliveryJob, 'findOne', () => ({ session: async () => job }));
  mock.method(Order, 'findById', () => ({ session: async () => order }));
  mock.method(Product, 'findById', () => ({ session: async () => product }));
  try {
    await returnStop('job', 'driver', 0, proof);
    assert.equal(product.availableQuantity, 6); assert.equal(order.deliveredQuantity, 4); assert.equal(order.status, 'returned');
    await assert.rejects(returnStop('job', 'driver', 0, proof), /Returnable stop not found/);
    assert.equal(product.availableQuantity, 6);
  } finally { mock.restoreAll(); }
});

test('suggested routes preserve pickup-before-dropoff and handle missing coordinates', () => {
  const points = [{ latitude: 6.9, longitude: 79.8 }, { latitude: 7.1, longitude: 80.1 }];
  const route = planRoute({ pickupPoints: points, dropoffPoints: [{ latitude: 7, longitude: 80 }] });
  assert.deepEqual(route.stops.map((point) => point.kind), ['pickup', 'pickup', 'dropoff']);
  assert.equal(route.optimized, true);
  assert.equal(planRoute({ pickupPoints: [{}], destination: {} }).optimized, false);
});
