import User from '../../models/User.js';
import { hasOutbidSubscription, mockSubscriptionsEnabled } from '../../services/buyer-subscriptions.js';

function result(user) {
  return { subscription: { provider: user.buyerSubscription?.provider ?? 'mock',
    status: hasOutbidSubscription(user) ? 'active' : 'inactive',
    expiresAt: user.buyerSubscription?.expiresAt ?? null }, mockAvailable: mockSubscriptionsEnabled() };
}

export async function getSubscription(request, response, next) {
  try { return response.json(result(await User.findById(request.user._id))); }
  catch (error) { return next(error); }
}

export async function changeSubscription(request, response, next) {
  try {
    const { action } = request.body;
    if (!['subscribe', 'cancel'].includes(action)) return response.status(400).json({ message: 'Select subscribe or cancel' });
    if (action === 'subscribe' && !mockSubscriptionsEnabled()) return response.status(503).json({ message: 'Mock subscriptions are disabled. Real billing has not been configured.' });
    const now = new Date();
    // Repeated activation requests keep the same end date; the client cannot set entitlement dates.
    const filter = { _id: request.user._id, role: 'buyer', isActive: true };
    if (action === 'subscribe') filter.$or = [
      { 'buyerSubscription.status': { $ne: 'active' } },
      { 'buyerSubscription.expiresAt': { $lte: now } },
      { 'buyerSubscription.expiresAt': null },
    ];
    await User.updateOne(filter, { $set: action === 'subscribe' ? {
      buyerSubscription: { provider: 'mock', status: 'active', expiresAt: new Date(now.getTime() + 30 * 86400000) },
    } : { 'buyerSubscription.status': 'cancelled' } }, { runValidators: true });
    return response.json(result(await User.findById(request.user._id)));
  } catch (error) { return next(error); }
}
