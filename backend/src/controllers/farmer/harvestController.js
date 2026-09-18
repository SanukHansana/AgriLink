import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import DeliveryJob from '../../models/DeliveryJob.js';
import { notify } from '../../services/notifications.js';
import { fail } from '../../services/bidding.js';
import { isValidMongoId, parseValidDate } from '../../utils/validation.js';

export async function updateHarvest(request, response, next) {
  try {
    const { productId } = request.params;
    const { harvestStatus, harvestDate, note } = request.body;
    if (!isValidMongoId(productId) || !['ready', 'delayed', 'growing'].includes(harvestStatus)) fail('Select a valid harvest and status');
    if (note !== undefined && (typeof note !== 'string' || note.trim().length > 500)) fail('Delay note must be 500 characters or fewer');
    const newDate = parseValidDate(harvestDate);
    if (harvestDate && !newDate) fail('Enter a valid harvest date');
    if (harvestStatus === 'delayed' && (!newDate || newDate <= new Date() || !note?.trim())) fail('Provide the revised future harvest date and a delay reason');
    const product = await mongoose.connection.transaction(async (session) => {
      const product = await Product.findOne({ _id: productId, farmer: request.user._id, listingType: 'future' }).session(session);
      if (!product) fail('Future harvest not found', 404);
      const orders = await Order.find({ product: productId, status: { $nin: ['delivered', 'cancelled'] } }).session(session);
      // Touch orders as well to serialize harvest updates against delivery creation.
      for (const order of orders) {
        if (order.deliveryJob && harvestStatus !== 'ready') fail('Cancel scheduled delivery jobs before changing harvest readiness', 409);
        await Order.updateOne({ _id: order._id }, { $set: { updatedAt: new Date() } }, { session });
      }
      if (await DeliveryJob.exists({ orders: { $in: orders.map((order) => order._id) }, status: { $in: ['accepted', 'collecting', 'inTransit'] } }).session(session)) fail('This harvest is already assigned for delivery', 409);
      if (harvestStatus === 'ready' && (newDate ?? product.harvestDate) > new Date()) fail('Harvest readiness date cannot be in the future');
      product.harvestStatus = harvestStatus;
      product.harvestDelayNote = harvestStatus === 'delayed' ? note.trim() : undefined;
      if (newDate) product.harvestDate = newDate;
      await product.save({ session });
      return product;
    });
    const buyers = await Order.find({ product: productId, status: { $nin: ['delivered', 'cancelled'] } }).distinct('buyer');
    for (const buyer of buyers) await notify(buyer,
      harvestStatus === 'delayed' ? `${product.name} harvest is delayed until ${product.harvestDate.toISOString().slice(0, 10)}: ${product.harvestDelayNote}` : `${product.name} harvest status: ${harvestStatus}.`,
      `harvest:${productId}:${product.updatedAt.toISOString()}`);
    return response.json({ product });
  } catch (error) { return next(error); }
}
