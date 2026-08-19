import Complaint, { COMPLAINT_CATEGORIES } from '../../models/Complaint.js';
import Order from '../../models/Order.js';
import Review from '../../models/Review.js';
import { isValidMongoId } from '../../utils/validation.js';

async function findBuyerOrder(orderId, buyerId) {
  return Order.findOne({ _id: orderId, buyer: buyerId });
}

export async function createBuyerReview(request, response, next) {
  try {
    const { orderId } = request.params;
    const { rating, comment } = request.body;

    if (!isValidMongoId(orderId)) {
      return response.status(400).json({ message: 'Enter a valid order ID' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return response.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    const order = await findBuyerOrder(orderId, request.user._id);
    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return response.status(400).json({ message: 'Only delivered orders can be reviewed' });
    }

    const existingReview = await Review.findOne({ order: order._id, buyer: request.user._id });
    if (existingReview) {
      return response.status(409).json({ message: 'You have already reviewed this order' });
    }

    const review = await Review.create({
      order: order._id,
      buyer: request.user._id,
      seller: order.seller,
      product: order.product,
      rating,
      comment,
    });

    return response.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createBuyerComplaint(request, response, next) {
  try {
    const { orderId } = request.params;
    const { category, description } = request.body;

    if (!isValidMongoId(orderId)) {
      return response.status(400).json({ message: 'Enter a valid order ID' });
    }

    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return response.status(400).json({ message: 'Enter a valid complaint category' });
    }

    if (typeof description !== 'string' || description.trim().length < 10) {
      return response.status(400).json({
        message: 'Complaint description must contain at least 10 characters',
      });
    }

    const order = await findBuyerOrder(orderId, request.user._id);
    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    const complaint = await Complaint.create({
      order: order._id,
      buyer: request.user._id,
      seller: order.seller,
      product: order.product,
      category,
      description,
    });

    return response.status(201).json({
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
}
