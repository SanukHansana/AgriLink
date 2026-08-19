import Order, { ORDER_STATUSES } from '../../models/Order.js';
import Product from '../../models/Product.js';
import {
  isPositiveNumber,
  isValidMongoId,
  parseValidDate,
} from '../../utils/validation.js';

function validateDeliveryAddress(address) {
  return Boolean(
    address &&
      typeof address === 'object' &&
      address.addressLine?.trim() &&
      address.city?.trim() &&
      address.district?.trim(),
  );
}

function createBuyerOrder(orderType) {
  return async (request, response, next) => {
    try {
      const {
        productId,
        quantity,
        pricePerUnit,
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

      if (!validateDeliveryAddress(deliveryAddress)) {
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

      const product = await Product.findOne({ _id: productId, status: 'active' });

      if (!product) {
        return response.status(404).json({ message: 'Product not found or no longer available' });
      }

      if (orderType === 'fixedPrice' && product.pricingMode === 'bidding') {
        return response.status(400).json({
          message: 'Fixed-price ordering is not available for this product',
        });
      }

      if (orderType === 'advance' && product.listingType !== 'future') {
        return response.status(400).json({
          message: 'Advance orders can only be created for future harvests',
        });
      }

      if (
        orderType === 'advance' &&
        product.harvestDate &&
        deliveryDate < new Date(product.harvestDate)
      ) {
        return response.status(400).json({
          message: 'Requested delivery date cannot be before the expected harvest date',
        });
      }

      const effectivePrice = product.fixedPrice ?? pricePerUnit;
      if (!isPositiveNumber(effectivePrice)) {
        return response.status(400).json({
          message: 'A positive price is required for this order',
        });
      }

      const order = await Order.create({
        buyer: request.user._id,
        seller: product.farmer,
        product: productId,
        orderType,
        quantity,
        unit: product.unit,
        pricePerUnit: effectivePrice,
        deliveryAddress,
        requestedDeliveryDate: deliveryDate,
        notes,
      });

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
