import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import Bid from '../src/models/Bid.js';
import Product from '../src/models/Product.js';
import Notification from '../src/models/Notification.js';
import { changeBuyerBid, counterBid } from '../src/controllers/buyer/bidActionsController.js';

test('buyer edits and withdrawal are owner-scoped, counter-offers require valid price and farmer ownership', async () => {
  const id = new mongoose.Types.ObjectId();
  const bid = { _id: id, buyer: 'buyer', product: 'product', bidAmount: 100, quantity: 2, status: 'active', updatedAt: new Date(), save: async () => {} };
  const product = { farmer: 'farmer', status: 'active', pricingMode: 'bidding', minimumBidPrice: 100, minimumOrderQuantity: 1, availableQuantity: 10, unit: 'kg', biddingClosesAt: new Date(Date.now() + 60000) };
  let result, failure;
  const response = { json(data) { result = data; return this; } };
  const next = (error) => { failure = error; };
  mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
  mock.method(Bid, 'findOne', (filter) => ({ session: async () => (filter.buyer && filter.buyer !== bid.buyer) || !['active', 'countered'].includes(bid.status) ? null : bid }));
  mock.method(Product, 'findById', () => ({ session: async () => product }));
  mock.method(Product, 'findOne', (filter) => ({ session: async () => filter.farmer === product.farmer ? product : null }));
  mock.method(Notification, 'updateOne', async () => ({}));
  const request = (user, body) => ({ params: { bidId: String(id) }, user: { _id: user }, body });
  try {
    await changeBuyerBid(request('other', { action: 'withdraw' }), response, next);
    assert.equal(failure.statusCode, 409); assert.equal(bid.status, 'active'); failure = null;
    await changeBuyerBid(request('buyer', { action: 'edit', bidAmount: 50, quantity: 2 }), response, next);
    assert.match(failure.message, /at least/); assert.equal(bid.bidAmount, 100); failure = null;
    await changeBuyerBid(request('buyer', { action: 'edit', bidAmount: 120, quantity: 3 }), response, next);
    assert.equal(result.bid.bidAmount, 120); assert.equal(result.bid.quantity, 3);
    await counterBid(request('other', { counterAmount: 130 }), response, next);
    assert.equal(failure.statusCode, 404); failure = null;
    await counterBid(request('farmer', { counterAmount: 130 }), response, next);
    assert.equal(result.bid.status, 'countered'); assert.equal(result.bid.counterAmount, 130);
    await changeBuyerBid(request('buyer', { action: 'withdraw' }), response, next);
    assert.equal(result.bid.status, 'withdrawn');
    await changeBuyerBid(request('buyer', { action: 'edit', bidAmount: 140, quantity: 2 }), response, next);
    assert.equal(failure.statusCode, 409);
  } finally { mock.restoreAll(); }
});
