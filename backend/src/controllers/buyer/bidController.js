import Bid, { BID_STATUSES } from '../../models/Bid.js';
import Product from '../../models/Product.js';
import { isPositiveNumber, isValidMongoId } from '../../utils/validation.js';

export async function createBid(request, response, next) {
  try {
    const { productId, bidAmount, quantity } = request.body;

    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }

    if (!isPositiveNumber(bidAmount)) {
      return response.status(400).json({ message: 'Bid amount must be a positive number' });
    }

    if (!isPositiveNumber(quantity)) {
      return response.status(400).json({ message: 'Quantity must be a positive number' });
    }

    const product = await Product.findOne({ _id: productId, status: 'active' });

    if (!product) {
      return response.status(404).json({ message: 'Product not found or no longer available' });
    }

    if (product.pricingMode === 'fixedPrice') {
      return response.status(400).json({ message: 'Bidding is not available for this product' });
    }

    const bid = await Bid.create({
      buyer: request.user._id,
      product: productId,
      bidAmount,
      quantity,
      unit: product.unit,
    });

    return response.status(201).json({
      message: 'Bid placed successfully',
      bid,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBuyerBids(request, response, next) {
  try {
    const { status } = request.query;
    const filter = { buyer: request.user._id };

    if (status) {
      if (!BID_STATUSES.includes(status)) {
        return response.status(400).json({ message: 'Enter a valid bid status' });
      }

      filter.status = status;
    }

    const bids = await Bid.find(filter)
      .populate('product', 'name images unit farmLocation minimumBidPrice biddingClosesAt status')
      .sort({ createdAt: -1 });

    return response.status(200).json({
      count: bids.length,
      bids,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBuyerBid(request, response, next) {
  try {
    const { bidId } = request.params;

    if (!isValidMongoId(bidId)) {
      return response.status(400).json({ message: 'Enter a valid bid ID' });
    }

    const bid = await Bid.findOne({
      _id: bidId,
      buyer: request.user._id,
    }).populate('product', 'name images unit farmLocation minimumBidPrice biddingClosesAt status');

    if (!bid) {
      return response.status(404).json({ message: 'Bid not found' });
    }

    return response.status(200).json({ bid });
  } catch (error) {
    return next(error);
  }
}
