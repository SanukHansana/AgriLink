import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import DeliveryJob from '../../models/DeliveryJob.js';
import { fail } from '../../services/bidding.js';
import Order, { ORDER_STATUSES } from '../../models/Order.js';
import { isValidMongoId } from '../../utils/validation.js';
import { requireOrderPayment } from '../../services/order-payment.js';
import { notify } from '../../services/notifications.js';

const FARMER_ORDER_UPDATES = ['confirmed', 'preparing', 'dispatched', 'inTransit', 'cancelled'];

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
    await mongoose.connection.transaction(async (session) => {
      const order = await Order.findOne({
        _id: orderId, seller: request.user._id,
        status: { $nin: ['inTransit', 'delivered', 'cancelled'] },
      }).session(session);
      if (!order) fail('Editable order not found or delivery has already started', 404);
      if (['preparing', 'dispatched', 'inTransit'].includes(status)) requireOrderPayment(order);
      if (status === 'inTransit') {
        const job = await DeliveryJob.findOne({ _id: order.deliveryJob, createdBy: request.user._id, status: 'collecting' }).session(session);
        if (!job || !job.assignedDriver || job.pickupPoints.some((point) => !point.completedAt)) fail('Assigned driver must confirm every farm pickup first', 409);
        job.status = 'inTransit'; job.transitStartedAt = new Date();
        job.statusUpdates.push({ status: 'inTransit', note: 'Farmer confirmed cargo departure' });
        await job.save({ session });
        await Order.updateMany({ _id: { $in: job.orders }, status: 'dispatched', paymentStatus: 'paid' }, { $set: { status: 'inTransit' } }, { session });
        return;
      }
      if (status === 'dispatched') fail('Publish a pickup job to dispatch this order to drivers', 409);
      if (order.deliveryJob) fail('Cancel the unassigned delivery job first, or let the driver update this order', 409);
      if (await DeliveryJob.exists({ orders: order._id, status: { $ne: 'cancelled' } }).session(session)) fail('This order is already scheduled for delivery', 409);
      const allowed = { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['dispatched', 'cancelled'], dispatched: ['cancelled'] };
      if (!allowed[order.status]?.includes(status)) fail('Invalid order status transition', 409);
      if (status === 'cancelled' && order.stockReserved) {
        const product = await Product.findById(order.product).session(session);
        if (!product) fail('Cannot restore stock because the product no longer exists', 409);
        product.availableQuantity += order.quantity;
        if (product.status === 'sold') product.status = 'active';
        await product.save({ session });
        order.stockReserved = false;
      }
      order.status = status;
      await order.save({ session });
    });
    const order = await populateOrder(Order.findById(orderId));
    if (status === 'inTransit' && order.deliveryJob) {
      const tripOrders = await Order.find({ deliveryJob: order.deliveryJob });
      for (const item of tripOrders) await notify(item.buyer, `Order ${item.orderCode} is out for delivery.`, `order-status:${item._id}:inTransit`);
    } else {
      const description = status === 'confirmed' ? 'accepted. Please pay for your order before the farmer can prepare it' : status;
      await notify(order.buyer._id ?? order.buyer, `Order ${order.orderCode} is ${description}.`, `order-status:${order._id}:${status}`);
    }
    return response.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    return next(error);
  }
}
