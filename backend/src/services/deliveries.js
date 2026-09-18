import mongoose from 'mongoose';
import DeliveryJob from '../models/DeliveryJob.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { fail, validAddress } from './bidding.js';
import { isValidMongoId } from '../utils/validation.js';

export function validatePickup(orders, pickupAt, now = new Date()) {
  if (!(pickupAt instanceof Date) || !Number.isFinite(pickupAt.getTime()) || pickupAt <= now) fail('Schedule pickup in the future');
  for (const order of orders) {
    if (!['preparing', 'dispatched'].includes(order.status)) fail('Start preparing each order before requesting pickup');
    const product = order.product;
    if (!product || typeof product !== 'object') fail('Product not found for this order', 409);
    if (product.listingType === 'future') {
      if (product.harvestStatus !== 'ready') fail('Mark the future harvest ready before requesting pickup');
      if (!product.harvestDate || pickupAt < new Date(product.harvestDate)) fail('Pickup cannot be before harvest');
    }
    const deliveryDayEnd = order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate) : null;
    deliveryDayEnd?.setUTCHours(23, 59, 59, 999);
    if (deliveryDayEnd && pickupAt > deliveryDayEnd) fail('Pickup cannot be after the requested delivery date');
  }
}

export function groupDropoffs(orders) {
  const groups = new Map();
  for (const order of orders) {
    const address = order.deliveryAddress.toObject?.() ?? order.deliveryAddress;
    const key = [String(order.buyer?._id ?? order.buyer), address.addressLine, address.city, address.district].map((part) => part.trim().toLowerCase()).join('|');
    if (!groups.has(key)) groups.set(key, { ...address, contactName: order.buyer?.name ?? 'Buyer', orders: [] });
    groups.get(key).orders.push(order._id);
  }
  return [...groups.values()];
}

export async function saveDeliveryJob(data, farmerId, jobId) {
  return mongoose.connection.transaction(async (session) => {
    const existing = jobId ? await DeliveryJob.findOne({ _id: jobId, createdBy: farmerId, status: 'available' }).session(session) : null;
    if (jobId && !existing) fail('Only unassigned delivery jobs can be edited', 409);
    const input = { ...(existing?.toObject() ?? {}), ...data };
    if (!Array.isArray(input.pickupPoints) || !input.pickupPoints.length || input.pickupPoints.length > 25 || input.pickupPoints.some((point) => !validAddress(point))) fail('Provide complete pickup addresses and valid coordinate pairs');
    if (!Array.isArray(input.orders) || !input.orders.length || input.orders.length > 25 || input.orders.some((id) => !isValidMongoId(id))) fail('Select between 1 and 25 valid orders');
    const ids = [...new Set(input.orders.map(String))];
    const orders = await Order.find({ _id: { $in: ids }, seller: farmerId }).populate('product').populate('buyer', 'name').session(session);
    if (orders.length !== ids.length) fail('Select orders that belong to your farmer account');
    validatePickup(orders, new Date(input.scheduledPickupAt));
    // Check legacy jobs too, then claim each order in the transaction so concurrent jobs conflict.
    if (await DeliveryJob.exists({ ...(jobId ? { _id: { $ne: jobId } } : {}), orders: { $in: ids }, status: { $ne: 'cancelled' } }).session(session)) fail('An order already has a delivery job', 409);
    const job = existing ?? new DeliveryJob({ createdBy: farmerId });
    for (const order of orders) {
      if (order.deliveryJob && String(order.deliveryJob) !== String(job._id)) fail('An order already has a delivery job', 409);
      order.deliveryJob = job._id;
      await order.save({ session });
    }
    if (existing) await Order.updateMany({ deliveryJob: job._id, _id: { $nin: ids } }, { $unset: { deliveryJob: '' } }, { session });
    const dropoffs = groupDropoffs(orders);
    Object.assign(job, {
      orders: ids, pickupPoints: input.pickupPoints?.map((point, index) => ({ ...point, sequence: index + 1 })),
      dropoffPoints: dropoffs, destination: dropoffs[0], cargoDescription: input.cargoDescription,
      totalWeightKg: input.totalWeightKg, payoutAmount: input.payoutAmount,
      routeDistanceKm: input.routeDistanceKm,
      scheduledPickupAt: input.scheduledPickupAt, sharedDelivery: ids.length > 1,
    });
    await job.save({ session });
    return job;
  });
}

export async function removeDeliveryJob(jobId, farmerId) {
  return mongoose.connection.transaction(async (session) => {
    const job = await DeliveryJob.findOneAndDelete({ _id: jobId, createdBy: farmerId, status: 'available' }, { session });
    if (!job) fail('Only unassigned delivery jobs can be cancelled', 409);
    await Order.updateMany({ deliveryJob: job._id }, { $unset: { deliveryJob: '' } }, { session });
    return job;
  });
}
