import Bid, { BID_STATUSES, PRODUCT_UNITS } from '../../models/Bid.js';
import { isPositiveNumber, isValidMongoId } from '../../utils/validation.js';

export async function createBid(request, response, next) {
  try {
    const { productId, bidAmount, quantity, unit } = request.body;

    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }

    if (!isPositiveNumber(bidAmount)) {
      return response.status(400).json({ message: 'Bid amount must be a positive number' });
    }

    if (!isPositiveNumber(quantity)) {
      return response.status(400).json({ message: 'Quantity must be a positive number' });
    }

    if (!PRODUCT_UNITS.includes(unit)) {
      return response.status(400).json({ message: 'Unit must be kg, piece or box' });
    }

    const bid = await Bid.create({
      buyer: request.user._id,
      product: productId,
      bidAmount,
      quantity,
      unit,
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

    const bids = await Bid.find(filter).sort({ createdAt: -1 });

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
    });

    if (!bid) {
      return response.status(404).json({ message: 'Bid not found' });
    }

    return response.status(200).json({ bid });
  } catch (error) {
    return next(error);
  }
}
