import Bid, { BID_STATUSES } from '../../models/Bid.js';
import Product from '../../models/Product.js';
import { isValidMongoId } from '../../utils/validation.js';

async function farmerProductIds(farmerId) {
  return Product.find({ farmer: farmerId }).distinct('_id');
}

function populateBid(query) {
  return query
    .populate('buyer', 'name email')
    .populate('product', 'name images unit status pricingMode biddingClosesAt');
}

export async function getFarmerBids(request, response, next) {
  try {
    const { productId, status } = request.query;
    if (status && !BID_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid bid status' });
    }
    if (productId && !isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }

    const productIds = await farmerProductIds(request.user._id);
    const filter = { product: { $in: productIds } };
    if (productId) {
      if (!productIds.some((id) => String(id) === productId)) {
        return response.status(404).json({ message: 'Farmer product not found' });
      }
      filter.product = productId;
    }
    if (status) filter.status = status;

    const bids = await populateBid(Bid.find(filter).sort({ createdAt: -1 }));
    return response.status(200).json({ count: bids.length, bids });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmerBidStatus(request, response, next) {
  try {
    const { bidId } = request.params;
    const { status } = request.body;
    if (!isValidMongoId(bidId)) {
      return response.status(400).json({ message: 'Enter a valid bid ID' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return response.status(400).json({ message: 'Bid status must be accepted or rejected' });
    }

    const productIds = await farmerProductIds(request.user._id);
    const bid = await populateBid(
      Bid.findOneAndUpdate(
        { _id: bidId, product: { $in: productIds }, status: 'active' },
        { $set: { status } },
        { new: true, runValidators: true },
      ),
    );
    if (!bid) {
      return response.status(404).json({
        message: 'Active bid not found or its status has already changed',
      });
    }

    return response.status(200).json({
      message: `Bid ${status} successfully`,
      bid,
    });
  } catch (error) {
    return next(error);
  }
}
