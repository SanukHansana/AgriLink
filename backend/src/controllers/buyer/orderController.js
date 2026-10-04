import mongoose from 'mongoose';
import { fail, reserveStock, validAddress } from '../../services/bidding.js';
import { notify } from '../../services/notifications.js';
import Order, { ORDER_STATUSES } from '../../models/Order.js';
import Product from '../../models/Product.js';
import DeliveryJob from '../../models/DeliveryJob.js';
import { validateDemoPayment } from '../../services/order-payment.js';
import {
  isPositiveNumber,
  isValidMongoId,
  parseValidDate,
} from '../../utils/validation.js';

function createBuyerOrder(orderType) {
  return async (request, response, next) => {
    try {
      const {
        productId,
        quantity,
        deliveryAddress,
        requestedDeliveryDate,
        notes,
      } = request.body;

      if (!isValidMongoId(productId)) {
        return response.status(400).json({ message: 'Enter a valid product ID' });
      }

      if (!isPositiveNumber(quantity)) {
        return response.status(400).json({ message: 'Quantity must be a positive number' });
      }

      if (!validAddress(deliveryAddress)) {
        return response.status(400).json({
          message: 'Delivery address, city and district are required',
        });
      }

      const deliveryDate = parseValidDate(requestedDeliveryDate);
      if (requestedDeliveryDate && !deliveryDate) {
        return response.status(400).json({ message: 'Enter a valid requested delivery date' });
      }

      if (orderType === 'advance' && !deliveryDate) {
        return response.status(400).json({
          message: 'Requested delivery date is required for an advance order',
        });
      }

      const order = await mongoose.connection.transaction(async (session) => {
        const product = await Product.findOne({ _id: productId, status: 'active' }).session(session);
        if (!product) fail('Product not found or no longer available', 404);
        if (product.pricingMode === 'bidding') fail('Use the bidding flow for this product');
        if (orderType === 'advance' && product.listingType !== 'future') fail('Advance orders can only be created for future harvests');
        if (orderType === 'fixedPrice' && product.listingType === 'future') fail('Use an advance order for future harvests');
        if (orderType === 'advance' && product.harvestDate && deliveryDate < new Date(product.harvestDate)) fail('Requested delivery date cannot be before the expected harvest date');
        if (quantity < product.minimumOrderQuantity) fail(`Quantity must be at least ${product.minimumOrderQuantity} ${product.unit}`);
        if (quantity > product.availableQuantity) fail('Requested quantity exceeds the available stock', 409);
        // The listing determines the price; clients cannot supply a lower price.
        const effectivePrice = product.fixedPrice;
        if (!isPositiveNumber(effectivePrice)) fail('This listing does not have a valid fixed price');
        await reserveStock(product, quantity, session);
        const [created] = await Order.create([{
          buyer: request.user._id, seller: product.farmer, product: productId,
          orderType, quantity, unit: product.unit, pricePerUnit: effectivePrice,
          deliveryAddress, requestedDeliveryDate: deliveryDate, notes, stockReserved: true,
        }], { session });
        return created;
      });

      await notify(order.seller, `New order ${order.orderCode} is awaiting confirmation.`, `order-created:${order._id}`);
      return response.status(201).json({
        message:
          orderType === 'advance'
            ? 'Advance order created successfully'
            : 'Fixed-price order created successfully',
        order,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const createFixedPriceOrder = createBuyerOrder('fixedPrice');
export const createAdvanceOrder = createBuyerOrder('advance');

export async function payBuyerOrder(request, response, next) {
  try {
    if (!isValidMongoId(request.params.orderId)) fail('Enter a valid order ID');
    validateDemoPayment(request.body);
    const order = await Order.findOneAndUpdate({ _id: request.params.orderId, buyer: request.user._id, status: 'confirmed', paymentStatus: { $ne: 'paid' } }, { $set: { paymentStatus: 'paid', paymentProvider: 'mock', paidAt: new Date() } }, { new: true, runValidators: true });
    if (!order) {
      const paid = await Order.findOne({ _id: request.params.orderId, buyer: request.user._id, paymentStatus: 'paid' });
      if (paid) return response.json({ order: paid });
      fail('Wait for the farmer to accept this order before paying', 409);
    }
    await notify(order.seller, `Demo payment received for ${order.orderCode}. You can prepare the order.`, `order-paid:${order._id}`);
    return response.json({ order, message: 'Mock payment complete. No money was charged.' });
  } catch (error) { return next(error); }
}

export async function receiveBuyerOrder(request, response, next) {
  try {
    if (!isValidMongoId(request.params.orderId)) fail('Enter a valid order ID');
    const order = await Order.findOneAndUpdate({ _id: request.params.orderId, buyer: request.user._id, status: 'delivered', receivedAt: null }, { $set: { receivedAt: new Date() } }, { new: true });
    if (!order) {
      const received = await Order.findOne({ _id: request.params.orderId, buyer: request.user._id, status: 'delivered', receivedAt: { $ne: null } });
      if (received) return response.json({ order: received });
      fail('Confirm receipt after the driver records delivery', 409);
    }
    await notify(order.seller, `Buyer confirmed receipt of ${order.orderCode}.`, `order-received:${order._id}`);
    return response.json({ order });
  } catch (error) { return next(error); }
}

export async function updateRequestedDeliveryDate(request, response, next) {
  try {
    const date = parseValidDate(request.body.requestedDeliveryDate);
    if (!isValidMongoId(request.params.orderId) || !date || date <= new Date()) fail('Enter a valid future delivery date');
    const order = await mongoose.connection.transaction(async (session) => {
      const order = await Order.findOne({ _id: request.params.orderId, buyer: request.user._id, status: { $in: ['pending', 'confirmed', 'preparing'] } }).session(session);
      if (!order) fail('Editable order not found', 409);
      if (order.deliveryJob || await DeliveryJob.exists({ orders: order._id, status: { $ne: 'cancelled' } }).session(session)) fail('Delivery is already scheduled. Contact the farmer.', 409);
      const product = await Product.findById(order.product).session(session);
      if (!product || (product.listingType === 'future' && date < product.harvestDate)) fail('Delivery must be on or after the revised harvest date');
      order.requestedDeliveryDate = date;
      await order.save({ session }); return order;
    });
    await notify(order.seller, `Buyer updated delivery for ${order.orderCode} to ${date.toISOString().slice(0, 10)}.`, `delivery-date:${order._id}:${order.updatedAt.toISOString()}`);
    return response.json({ order });
  } catch (error) { return next(error); }
}

export async function getBuyerOrders(request, response, next) {
  try {
    const { status } = request.query;
    const filter = { buyer: request.user._id };

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return response.status(400).json({ message: 'Enter a valid order status' });
      }

      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('product', 'name images unit farmLocation')
      .populate('seller', 'name')
      .sort({ createdAt: -1 });

    return response.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBuyerOrder(request, response, next) {
  try {
    const { orderId } = request.params;

    if (!isValidMongoId(orderId)) {
      return response.status(400).json({ message: 'Enter a valid order ID' });
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: request.user._id,
    })
      .populate('product', 'name images unit farmLocation')
      .populate('seller', 'name');

    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    return response.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
}
