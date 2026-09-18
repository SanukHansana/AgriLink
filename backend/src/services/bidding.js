import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { isPositiveNumber, validMapPin } from '../utils/validation.js';
import { notify } from './notifications.js';

export function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

export function validateBid(product, amount, quantity, now = new Date(), allowClosed = false) {
  if (!product || product.status !== 'active') fail('Product is no longer available', 409);
  if (!['bidding', 'both'].includes(product.pricingMode)) fail('Bidding is not available for this product');
  const closingTime = new Date(product.biddingClosesAt).getTime();
  if (!product.biddingClosesAt || !Number.isFinite(closingTime) || (!allowClosed && closingTime <= now.getTime())) fail('Bidding has closed for this product');
  if (!isPositiveNumber(amount) || !isPositiveNumber(product.minimumBidPrice) || amount < product.minimumBidPrice) {
    fail(`Bid price must be at least ${product.minimumBidPrice} per ${product.unit}`);
  }
  if (!isPositiveNumber(quantity) || quantity < product.minimumOrderQuantity) fail(`Quantity must be at least ${product.minimumOrderQuantity} ${product.unit}`);
  if (quantity > product.availableQuantity) fail('Requested quantity exceeds the available stock', 409);
}

export function validAddress(address) {
  return address && typeof address === 'object' && validMapPin(address) &&
    [['addressLine', 180], ['city', 80], ['district', 80]].every(([key, max]) =>
      typeof address[key] === 'string' && address[key].trim().length > 0 && address[key].trim().length <= max);
}

export async function expireBids(filter) {
  const products = await Product.find({ biddingClosesAt: { $lte: new Date() }, $or: [{ autoAcceptHighestBid: { $ne: true } }, { auctionProcessedAt: { $exists: true } }] }).distinct('_id');
  if (products.length) await Bid.updateMany(
    { $and: [filter, { status: { $in: ['active', 'countered'] }, product: { $in: products } }] },
    { $set: { status: 'expired' } },
  );
}

// Use the same reservation for direct purchases and bid acceptance.
export async function reserveStock(product, quantity, session) {
  const updated = await Product.findOneAndUpdate(
    { _id: product._id, status: 'active', availableQuantity: { $gte: quantity } },
    { $inc: { availableQuantity: -quantity } },
    { new: true, session, runValidators: true },
  );
  if (!updated) fail('Product stock changed. Refresh and try again.', 409);
  if (updated.availableQuantity === 0) {
    updated.status = 'sold';
    await updated.save({ session });
  }
}

export async function acceptBid(bidId, farmerId, options = {}) {
  const result = await mongoose.connection.transaction(async (session) => {
    const bid = await Bid.findOne({ _id: bidId }).session(session);
    if (!bid) fail('Bid not found', 404);
    const product = await Product.findOne({ _id: bid.product, farmer: farmerId }).session(session);
    if (!product) fail('Farmer product not found', 404);
    if (bid.status !== (options.counter ? 'countered' : 'active')) fail('This bid has already been processed', 409);
    if (options.buyerId && String(bid.buyer) !== String(options.buyerId)) fail('Bid not found', 404);
    const amount = options.counter ? bid.counterAmount : bid.bidAmount;
    if (bid.unit !== product.unit) fail('The listing unit changed. Ask the buyer to submit a new bid.');
    if (options.automatic) {
      if (!product.autoAcceptHighestBid || product.auctionProcessedAt || product.biddingClosesAt > new Date()) fail('Auction is not eligible for automatic acceptance', 409);
      product.auctionProcessedAt = new Date();
      await product.save({ session });
    }
    validateBid(product, amount, bid.quantity, new Date(), options.automatic);
    if (!validAddress(bid.deliveryAddress)) fail('This older bid has no delivery address. Ask the buyer to submit a new bid.');
    if (product.listingType === 'future' && (!bid.requestedDeliveryDate || new Date(bid.requestedDeliveryDate) < new Date(product.harvestDate))) {
      fail('The requested delivery date must be on or after the harvest date');
    }
    await reserveStock(product, bid.quantity, session);
    const [order] = await Order.create([{
      bid: bid._id, buyer: bid.buyer, seller: farmerId, product: product._id,
      orderType: 'bid', quantity: bid.quantity, unit: bid.unit,
      pricePerUnit: amount, deliveryAddress: bid.deliveryAddress,
      requestedDeliveryDate: bid.requestedDeliveryDate, status: 'confirmed', stockReserved: true,
    }], { session });
    bid.status = 'accepted';
    bid.bidAmount = amount;
    bid.order = order._id;
    await bid.save({ session });
    return { bidId: bid._id, order };
  });
  await notify(result.order.buyer, `Your bid was accepted. Order ${result.order.orderCode} is confirmed.`, `bid-accepted:${bidId}`);
  await notify(result.order.seller, `Order ${result.order.orderCode} was created from an accepted bid.`, `bid-accepted:${bidId}`);
  return result;
}
