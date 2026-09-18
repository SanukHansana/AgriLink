import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import DeliveryJob from '../src/models/DeliveryJob.js';
import { updateHarvest } from '../src/controllers/farmer/harvestController.js';

test('harvest updates require ownership, complete delay details and cancellation of scheduled pickups', async () => {
  const id = new mongoose.Types.ObjectId();
  const product = { _id: id, name: 'Harvest', harvestDate: new Date(Date.now() - 3600000), updatedAt: new Date(), save: async () => {} };
  const order = { _id: new mongoose.Types.ObjectId(), deliveryJob: undefined };
  let result, failure;
  const response = { json(data) { result = data; } };
  const next = (error) => { failure = error; };
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(Product, 'findOne', (filter) => ({ session: async () => filter.farmer === 'farmer' ? product : null }));
  mock.method(Order, 'find', () => ({ session: async () => [order], distinct: async () => [] }));
  mock.method(Order, 'updateOne', async () => ({}));
  mock.method(DeliveryJob, 'exists', () => ({ session: async () => false }));
  const request = (user, body) => ({ params: { productId: String(id) }, user: { _id: user }, body });
  try {
    await updateHarvest(request('other', { harvestStatus: 'ready' }), response, next);
    assert.equal(failure.statusCode, 404); failure = null;
    await updateHarvest(request('farmer', { harvestStatus: 'delayed' }), response, next);
    assert.equal(failure.statusCode, 400); failure = null;
    order.deliveryJob = new mongoose.Types.ObjectId();
    await updateHarvest(request('farmer', { harvestStatus: 'delayed', harvestDate: new Date(Date.now() + 86400000).toISOString(), note: 'Rain delay' }), response, next);
    assert.equal(failure.statusCode, 409); failure = null;
    order.deliveryJob = undefined;
    await updateHarvest(request('farmer', { harvestStatus: 'delayed', harvestDate: new Date(Date.now() + 86400000).toISOString(), note: 'Rain delay' }), response, next);
    assert.equal(result.product.harvestStatus, 'delayed');
    assert.equal(result.product.harvestDelayNote, 'Rain delay');
    await updateHarvest(request('farmer', { harvestStatus: 'ready' }), response, next);
    assert.equal(failure.statusCode, 400); failure = null;
    await updateHarvest(request('farmer', { harvestStatus: 'ready', harvestDate: new Date(Date.now() - 1000).toISOString() }), response, next);
    assert.equal(result.product.harvestStatus, 'ready');
  } finally { mock.restoreAll(); }
});
