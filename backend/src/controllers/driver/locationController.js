import mongoose from 'mongoose';
import { validateProof } from '../../services/driver-workflows.js';
import DeliveryJob from '../../models/DeliveryJob.js';
import Order from '../../models/Order.js';
import { fail } from '../../services/bidding.js';
import { isValidMongoId, validCoordinates } from '../../utils/validation.js';

export async function shareLocation(request, response, next) {
  try {
    if (!isValidMongoId(request.params.jobId)) fail('Invalid delivery ID');
    const { latitude, longitude, sharing, start, sessionId } = request.body;
    if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 80) fail('Provide a valid location-sharing session');
    if (sharing !== false && start !== true && !validCoordinates(latitude, longitude)) fail('Provide valid latitude and longitude');
    const job = await DeliveryJob.findOneAndUpdate({ _id: request.params.jobId, assignedDriver: request.user._id, status: { $in: ['accepted', 'collecting', 'inTransit'] }, ...(start === true ? {} : { trackingSessionId: sessionId }) },
      sharing === false ? { $unset: { driverLocation: '', trackingSessionId: '' } } : start === true ? { $set: { trackingSessionId: sessionId }, $unset: { driverLocation: '' } } : { $set: { driverLocation: { latitude, longitude, recordedAt: new Date() } } }, { new: true, runValidators: true });
    if (!job) fail('Active assigned delivery not found', 404);
    return response.json({ location: job.driverLocation ?? null });
  } catch (error) { return next(error); }
}

export async function completeStop(request, response, next) {
  try {
    const { kind, index, stopId, proof, outcome = 'delivered', failureReason, deliveredQuantities, operationId } = request.body;
    if (!isValidMongoId(request.params.jobId) || !['pickup', 'dropoff'].includes(kind) || !Number.isInteger(index) || index < 0 || index > 24) fail('Select a valid stop');
    if (operationId !== undefined && (typeof operationId !== 'string' || operationId.length > 80)) fail('Invalid operation ID');
    if (kind === 'dropoff') {
      validateProof(proof);
      if (!['delivered', 'failed', 'partial'].includes(outcome)) fail('Select a delivery outcome');
      if (outcome !== 'delivered' && (typeof failureReason !== 'string' || failureReason.trim().length < 10 || failureReason.length > 500)) fail('Provide a failure reason of 10–500 characters');
    }
    const job = await mongoose.connection.transaction(async (session) => {
      const job = await DeliveryJob.findOne({ _id: request.params.jobId, assignedDriver: request.user._id }).session(session);
      const points = job?.[kind === 'pickup' ? 'pickupPoints' : 'dropoffPoints'];
      const point = stopId ? points?.find((point) => String(point._id) === stopId) : points?.[index];
      if (!point) fail('Stop not available', 409);
      if (point.completedAt) {
        if (operationId && point.operationId === operationId) return job;
        fail('Stop already completed', 409);
      }
      if (job.status !== (kind === 'pickup' ? 'collecting' : 'inTransit')) fail('This trip is not at the required stage for this stop', 409);
      if (kind === 'dropoff') {
        const orders = await Order.find({ _id: { $in: point.orders } }).session(session);
        if (orders.length !== point.orders.length) fail('Order not found', 409);
        const quantities = orders.map((order) => ({ order: order._id, quantity: outcome === 'delivered' ? order.quantity : outcome === 'failed' ? 0 : deliveredQuantities?.find((item) => String(item.order) === String(order._id))?.quantity }));
        if (quantities.some((item, i) => typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity < 0 || item.quantity > orders[i].quantity) || (outcome === 'partial' && (!quantities.some((item) => item.quantity > 0) || !quantities.some((item, i) => item.quantity < orders[i].quantity)))) fail('Enter a valid delivered quantity for every order');
        for (let i = 0; i < orders.length; i++) {
          orders[i].deliveredQuantity = quantities[i].quantity;
          orders[i].status = outcome === 'delivered' ? 'delivered' : 'deliveryFailed';
          await orders[i].save({ session });
        }
        point.outcome = outcome; point.deliveredQuantities = quantities; point.failureReason = failureReason;
        point.receiverName = proof.receiverName.trim(); point.receiverSignature = proof.receiverSignature.trim(); point.photoData = proof.photoData; point.photoAttached = true;
      }
      point.completedAt = new Date(); point.operationId = operationId;
      await job.save({ session }); return job;
    });
    return response.json({ job });
  } catch (error) { return next(error); }
}

export async function getOrderDelivery(request, response, next) {
  try {
    if (!isValidMongoId(request.params.orderId)) fail('Invalid order ID');
    const order = await Order.findOne({ _id: request.params.orderId, buyer: request.user._id });
    if (!order) fail('Order not found', 404);
    const job = await DeliveryJob.findOne({ orders: order._id, status: { $ne: 'cancelled' } }).select('jobCode status driverLocation pickupPoints dropoffPoints scheduledPickupAt');
    if (!job) return response.json({ job: null });
    const data = job.toObject();
    if (!data.driverLocation?.recordedAt || Date.now() - data.driverLocation.recordedAt.getTime() > 120000) delete data.driverLocation;
    data.dropoffPoints = data.dropoffPoints?.filter((point) => point.orders.some((id) => String(id) === order.id));
    return response.json({ job: data });
  } catch (error) { return next(error); }
}
