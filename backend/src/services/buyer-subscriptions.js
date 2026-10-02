import User from '../models/User.js';
import Bid from '../models/Bid.js';
import Product from '../models/Product.js';
import { notify } from './notifications.js';

export function mockSubscriptionsEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.MOCK_SUBSCRIPTIONS_ENABLED !== 'false';
}

export function hasOutbidSubscription(user, now = new Date()) {
  return user?.role === 'buyer' && user.isActive !== false &&
    user.buyerSubscription?.status === 'active' && new Date(user.buyerSubscription.expiresAt) > now;
}

// Prices are compared per unit, not total order value. Ties do not outbid.
export async function notifyOutbidBuyers(bid) {
  try {
    const product = await Product.findById(bid.product);
    if (!product || product.status !== 'active' || product.biddingClosesAt <= new Date()) return;
    const buyers = await Bid.find({ product: bid.product, buyer: { $ne: bid.buyer },
      status: 'active', unit: bid.unit, bidAmount: { $lt: bid.bidAmount } }).distinct('buyer');
    if (!buyers.length) return;
    const subscribers = await User.find({ _id: { $in: buyers }, role: 'buyer', isActive: true,
      'buyerSubscription.status': 'active', 'buyerSubscription.expiresAt': { $gt: new Date() } });
    for (const user of subscribers) {
      if (!hasOutbidSubscription(user)) continue;
      await notify(user._id, `You have been outbid on ${product.name}. Another buyer offered LKR ${bid.bidAmount} per ${bid.unit}. Open My Bids to revise your offer.`, `outbid:${bid._id}:${bid.updatedAt.toISOString()}`);
    }
  } catch (error) { console.error('Unable to send outbid alerts:', error.message); }
}
