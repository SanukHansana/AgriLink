import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import DeliveryJob from '../src/models/DeliveryJob.js';
import Order from '../src/models/Order.js';
import { shareLocation, getOrderDelivery, completeStop } from '../src/controllers/driver/locationController.js';

test('location updates are restricted to the assigned driver and active trip', async () => {
  let failure;
  const next = (error) => { failure = error; };
  const response = { json(data) { return data; } };
  const request = { params: { jobId: '507f1f77bcf86cd799439011' }, user: { _id: 'driver' }, body: { latitude: 91, longitude: 80 } };
  mock.method(DeliveryJob, 'findOneAndUpdate', async (filter) => {
    assert.equal(filter.assignedDriver, 'driver');
    assert.deepEqual(filter.status.$in, ['accepted', 'collecting', 'inTransit']);
    return null;
  });
  try {
    await shareLocation(request, response, next); assert.equal(failure.statusCode, 400);
    request.body.latitude = 6.9;
    await shareLocation(request, response, next); assert.equal(failure.statusCode, 404);
  } finally { mock.restoreAll(); }
});

test('buyer tracking hides other buyers drop-offs and stale driver coordinates', async () => {
  const id = '507f1f77bcf86cd799439011'; let result;
  mock.method(Order, 'findOne', async (filter) => { assert.equal(filter.buyer, 'buyer'); return { _id: id, id }; });
  mock.method(DeliveryJob, 'findOne', () => ({ select: async () => ({ toObject: () => ({
    driverLocation: { latitude: 6.9, longitude: 80, recordedAt: new Date(Date.now() - 180000) },
    dropoffPoints: [{ orders: [id], addressLine: 'My address' }, { orders: ['other'], addressLine: 'Other address' }],
  }) }) }));
  try {
    await getOrderDelivery({ params: { orderId: id }, user: { _id: 'buyer' } }, { json(data) { result = data; } }, (error) => { throw error; });
    assert.equal(result.job.driverLocation, undefined);
    assert.equal(result.job.dropoffPoints.length, 1);
    assert.equal(result.job.dropoffPoints[0].addressLine, 'My address');
  } finally { mock.restoreAll(); }
});

test('stop confirmation requires correct trip stage, assigned driver and receiver name', async () => {
  let failure;
  mock.method(DeliveryJob, 'findOneAndUpdate', async (filter) => { assert.equal(filter.status, 'inTransit'); assert.equal(filter.assignedDriver, 'driver'); return null; });
  const request = { params: { jobId: '507f1f77bcf86cd799439011' }, user: { _id: 'driver' }, body: { kind: 'dropoff', index: 0 } };
  try {
    await completeStop(request, { json() {} }, (error) => { failure = error; }); assert.equal(failure.statusCode, 400);
    request.body.receiverName = 'Receiver';
    await completeStop(request, { json() {} }, (error) => { failure = error; }); assert.equal(failure.statusCode, 409);
  } finally { mock.restoreAll(); }
});
