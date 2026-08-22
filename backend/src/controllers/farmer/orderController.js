import Order, { ORDER_STATUSES } from '../../models/Order.js';
import { isValidMongoId } from '../../utils/validation.js';

const FARMER_ORDER_UPDATES = ['confirmed', 'preparing', 'dispatched', 'cancelled'];

function populateOrder(query) {
  return query
    .populate('product', 'name images unit farmLocation')
    .populate('buyer', 'name email');
}

export async function getFarmerOrders(request, response, next) {
  try {
    const { status } = request.query;
    if (status && !ORDER_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid order status' });
    }
    const filter = { seller: request.user._id };
    if (status) filter.status = status;
    const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
    return response.status(200).json({ count: orders.length, orders });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerOrder(request, response, next) {
  try {
    const { orderId } = request.params;
    if (!isValidMongoId(orderId)) {
      return response.status(400).json({ message: 'Enter a valid order ID' });
    }
    const order = await populateOrder(
      Order.findOne({ _id: orderId, seller: request.user._id }),
    );
    if (!order) return response.status(404).json({ message: 'Order not found' });
    return response.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmerOrderStatus(request, response, next) {
  try {
    const { orderId } = request.params;
    const { status } = request.body;
    if (!isValidMongoId(orderId)) {
      return response.status(400).json({ message: 'Enter a valid order ID' });
    }
    if (!FARMER_ORDER_UPDATES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid farmer order status' });
    }
    const order = await populateOrder(
      Order.findOneAndUpdate(
        {
          _id: orderId,
          seller: request.user._id,
          status: { $nin: ['inTransit', 'delivered', 'cancelled'] },
        },
        { $set: { status } },
        { new: true, runValidators: true },
      ),
    );
    if (!order) {
      return response.status(404).json({
        message: 'Editable order not found or delivery has already started',
      });
    }
    return response.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    return next(error);
  }
}
