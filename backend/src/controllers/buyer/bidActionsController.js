import mongoose from 'mongoose';
import Bid from '../../models/Bid.js';
import Product from '../../models/Product.js';
import { acceptBid, validateBid, fail } from '../../services/bidding.js';
import { notify } from '../../services/notifications.js';
import { isValidMongoId } from '../../utils/validation.js';

export async function changeBuyerBid(request, response, next) {
  try {
    const { bidId } = request.params;
    const { action, bidAmount, quantity } = request.body;
    if (!isValidMongoId(bidId) || !['withdraw', 'edit', 'acceptCounter', 'declineCounter'].includes(action)) fail('Select a valid bid action');
    if (action === 'acceptCounter') {
      const bid = await Bid.findOne({ _id: bidId, buyer: request.user._id });
      if (!bid) fail('Bid not found', 404);
      const product = await Product.findById(bid.product);
      if (!product) fail('Product not found', 404);
      const result = await acceptBid(bidId, product.farmer, { counter: true, buyerId: request.user._id });
      return response.json({ bid: await Bid.findById(bidId), order: result.order });
    }
    const bid = await mongoose.connection.transaction(async (session) => {
      const bid = await Bid.findOne({ _id: bidId, buyer: request.user._id, status: { $in: ['active', 'countered'] } }).session(session);
      if (!bid) fail('Editable bid not found', 409);
      if (action === 'withdraw') bid.status = 'withdrawn';
      else if (action === 'declineCounter') {
        if (bid.status !== 'countered') fail('This bid has no counter-offer');
        bid.status = 'rejected';
      } else {
        const product = await Product.findById(bid.product).session(session);
        validateBid(product, bidAmount, quantity);
        bid.bidAmount = bidAmount; bid.quantity = quantity; bid.status = 'active'; bid.counterAmount = undefined;
      }
      await bid.save({ session });
      return bid;
    });
    return response.json({ bid });
  } catch (error) { return next(error); }
}

export async function counterBid(request, response, next) {
  try {
    if (!isValidMongoId(request.params.bidId)) fail('Invalid bid ID');
    const bid = await mongoose.connection.transaction(async (session) => {
      const bid = await Bid.findOne({ _id: request.params.bidId, status: { $in: ['active', 'countered'] } }).session(session);
      if (!bid) fail('Active bid not found', 409);
      const product = await Product.findOne({ _id: bid.product, farmer: request.user._id }).session(session);
      if (!product) fail('Farmer product not found', 404);
      validateBid(product, request.body.counterAmount, bid.quantity);
      bid.counterAmount = request.body.counterAmount; bid.status = 'countered';
      await bid.save({ session }); return bid;
    });
    await notify(bid.buyer, `The farmer offered ${bid.counterAmount} per ${bid.unit}. Review your bid to accept or decline.`, `counter:${bid._id}:${bid.updatedAt.toISOString()}`);
    return response.json({ bid });
  } catch (error) { return next(error); }
}
