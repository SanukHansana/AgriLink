import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import DeliveryJob from '../src/models/DeliveryJob.js';
import Order from '../src/models/Order.js';
import Notification from '../src/models/Notification.js';
import { updateDeliveryJobStatus } from '../src/controllers/driver/deliveryJobController.js';
test('assigned driver can arrive before scheduled pickup; transit still requires pickup confirmation', async () => {
  const job = { _id: new mongoose.Types.ObjectId(), assignedDriver: 'driver', createdBy: 'farmer', jobCode: 'JOB-1', orders: [], status: 'accepted', scheduledPickupAt: new Date(Date.now() + 86400000), pickupPoints: [{ completedAt: undefined }] };
  mock.method(DeliveryJob, 'findOne', async (filter) => { assert.equal(filter.assignedDriver, 'driver'); return job; });
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(DeliveryJob, 'findOneAndUpdate', async (filter, update) => { assert.equal(filter.status, 'accepted'); return { ...job, status: update.$set.status }; });
  mock.method(Order, 'updateMany', async () => ({}));
  mock.method(Order, 'find', async () => []);
  mock.method(Notification, 'updateOne', async () => ({ upsertedCount: 0 }));
  let result; let error;
  const request = { params: { jobId: String(job._id) }, user: { _id: 'driver' }, body: { status: 'collecting' } };
  const response = { status() { return this; }, json(value) { result = value; } };
  try {
    await updateDeliveryJobStatus(request, response, (cause) => { error = cause; });
    assert.equal(error, undefined); assert.equal(result.job.status, 'collecting');
    job.status = 'collecting'; request.body.status = 'inTransit';
    await updateDeliveryJobStatus(request, response, (cause) => { error = cause; });
    assert.match(error.message, /Confirm every pickup stop/);
  } finally { mock.restoreAll(); }
});
