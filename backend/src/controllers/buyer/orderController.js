import Order, { ORDER_STATUSES } from '../../models/Order.js';
import { PRODUCT_UNITS } from '../../models/Bid.js';
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
        sellerId,
        quantity,
        unit,
        pricePerUnit,
        deliveryAddress,
        requestedDeliveryDate,
        notes,
      } = request.body;

      if (!isValidMongoId(productId)) {
        return response.status(400).json({ message: 'Enter a valid product ID' });
      }

      if (!isValidMongoId(sellerId)) {
        return response.status(400).json({ message: 'Enter a valid seller ID' });
      }

      if (!isPositiveNumber(quantity)) {
        return response.status(400).json({ message: 'Quantity must be a positive number' });
      }

      if (!isPositiveNumber(pricePerUnit)) {
        return response.status(400).json({ message: 'Price per unit must be a positive number' });
      }

      if (!PRODUCT_UNITS.includes(unit)) {
        return response.status(400).json({ message: 'Unit must be kg, piece or box' });
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

      const order = await Order.create({
        buyer: request.user._id,
        seller: sellerId,
        product: productId,
        orderType,
        quantity,
        unit,
        pricePerUnit,
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

    const orders = await Order.find(filter).sort({ createdAt: -1 });

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
    });

    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    return response.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
}
