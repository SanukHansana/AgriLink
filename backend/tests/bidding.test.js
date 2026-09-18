import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import mongoose from 'mongoose';
import Bid from '../src/models/Bid.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import Notification from '../src/models/Notification.js';
import { acceptBid, validateBid, validAddress } from '../src/services/bidding.js';

const listing = () => ({ _id: 'product', farmer: 'farmer', status: 'active', pricingMode: 'both', minimumBidPrice: 100, minimumOrderQuantity: 2, availableQuantity: 10, unit: 'kg', listingType: 'current', biddingClosesAt: new Date(Date.now() + 60000) });

test('bid limits reject low prices, invalid quantities, unavailable listings and deadlines', () => {
  const product = listing();
  assert.doesNotThrow(() => validateBid(product, 100, 2));
  assert.doesNotThrow(() => validateBid(product, 100, 10));
  for (const [changes, price, quantity] of [
    [{}, 99, 2], [{}, NaN, 2], [{}, 100, 1], [{}, 100, 11], [{}, 100, Infinity],
    [{ pricingMode: 'fixedPrice' }, 100, 2], [{ status: 'inactive' }, 100, 2],
    [{ biddingClosesAt: new Date(0) }, 100, 2], [{ biddingClosesAt: 'invalid' }, 100, 2],
  ]) assert.throws(() => validateBid({ ...product, ...changes }, price, quantity));
  const now = new Date();
  assert.throws(() => validateBid({ ...product, biddingClosesAt: now }, 100, 2, now), /closed/);
  assert.equal(Boolean(validAddress({ addressLine: 123, city: 'City', district: 'District' })), false);
  assert.equal(Boolean(validAddress({ addressLine: 'Street', city: ' ', district: 'District' })), false);
});

// Model doubles verify transaction/session usage and behavior without touching user data.
test('acceptance creates one order at the bid price, reserves stock and prevents repeat acceptance', async () => {
  const session = {};
  const product = listing();
  const bid = { _id: 'bid', buyer: 'buyer', product: 'product', bidAmount: 125, quantity: 10, unit: 'kg', status: 'active', deliveryAddress: { addressLine: 'Street', city: 'City', district: 'District' } };
  let orders = [];
  let failOrder = false;
  product.save = async (options) => assert.equal(options.session, session);
  bid.save = async (options) => assert.equal(options.session, session);
  mock.method(mongoose.connection, 'transaction', async (callback) => {
    const before = { quantity: product.availableQuantity, status: product.status, bidStatus: bid.status, order: bid.order, orders: [...orders] };
    try { return await callback(session); }
    catch (error) { product.availableQuantity = before.quantity; product.status = before.status; bid.status = before.bidStatus; bid.order = before.order; orders = before.orders; throw error; }
  });
  mock.method(Notification, 'updateOne', async () => ({}));
  mock.method(Bid, 'findOne', () => ({ session: async (value) => { assert.equal(value, session); return bid; } }));
  mock.method(Product, 'findOne', (filter) => ({ session: async () => filter.farmer === 'farmer' ? product : null }));
  mock.method(Product, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(options.session, session);
    assert.equal(filter.availableQuantity.$gte, bid.quantity);
    if (product.availableQuantity < filter.availableQuantity.$gte) return null;
    product.availableQuantity += update.$inc.availableQuantity;
    return product;
  });
  mock.method(Order, 'create', async ([data], options) => {
    assert.equal(options.session, session);
    if (failOrder) throw new Error('Order insert failed');
    const order = { ...data, _id: 'order' }; orders.push(order); return [order];
  });
  try {
    await assert.rejects(acceptBid('bid', 'other-farmer'), /Farmer product not found/);
    product.availableQuantity = 9;
    await assert.rejects(acceptBid('bid', 'farmer'), /available stock/);
    product.availableQuantity = 10;
    const address = bid.deliveryAddress;
    bid.deliveryAddress = undefined;
    await assert.rejects(acceptBid('bid', 'farmer'), /no delivery address/);
    bid.deliveryAddress = address;
    product.listingType = 'future';
    product.harvestDate = new Date(Date.now() + 86400000);
    await assert.rejects(acceptBid('bid', 'farmer'), /harvest date/);
    product.listingType = 'current';
    failOrder = true;
    await assert.rejects(acceptBid('bid', 'farmer'), /Order insert failed/);
    assert.equal(product.availableQuantity, 10);
    assert.equal(product.status, 'active');
    assert.equal(bid.status, 'active');
    assert.equal(orders.length, 0);
    failOrder = false;
    const result = await acceptBid('bid', 'farmer');
    assert.equal(result.order.pricePerUnit, 125);
    assert.equal(result.order.status, 'confirmed');
    assert.deepEqual(result.order.deliveryAddress, bid.deliveryAddress);
    assert.equal(result.order.bid, 'bid');
    assert.equal(product.availableQuantity, 0);
    assert.equal(product.status, 'sold');
    assert.equal(bid.status, 'accepted');
    assert.equal(bid.order, 'order');
    await assert.rejects(acceptBid('bid', 'farmer'), /already been processed/);
    assert.equal(orders.length, 1);
    product.availableQuantity = 10; product.status = 'active'; bid.status = 'countered'; bid.counterAmount = 150;
    await assert.rejects(acceptBid('bid', 'farmer', { counter: true, buyerId: 'other' }), /Bid not found/);
    const counter = await acceptBid('bid', 'farmer', { counter: true, buyerId: 'buyer' });
    assert.equal(counter.order.pricePerUnit, 150);
    assert.equal(bid.bidAmount, 150);
    product.availableQuantity = 10; product.status = 'active'; product.autoAcceptHighestBid = true;
    product.biddingClosesAt = new Date(0); bid.status = 'active';
    await assert.rejects(acceptBid('bid', 'farmer'), /Bidding has closed/);
    const automatic = await acceptBid('bid', 'farmer', { automatic: true });
    assert.equal(automatic.order.pricePerUnit, 150);
    assert.ok(product.auctionProcessedAt);
    bid.status = 'active';
    await assert.rejects(acceptBid('bid', 'farmer', { automatic: true }), /not eligible/);
  } finally { mock.restoreAll(); }
});
