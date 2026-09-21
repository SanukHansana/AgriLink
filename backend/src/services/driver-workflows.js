import mongoose from 'mongoose';
import DeliveryJob from '../models/DeliveryJob.js';
import DriverProfile from '../models/DriverProfile.js';
import DeliveryIssue from '../models/DeliveryIssue.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { fail } from './bidding.js';
import { notify } from './notifications.js';

export function validLicence(date, now = new Date()) {
  const expiry = new Date(date);
  if (!date || !Number.isFinite(expiry.getTime())) return false;
  // Licence date is inclusive, using the Sri Lankan calendar day.
  return expiry.toISOString().slice(0, 10) >= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validateProof(proof) {
  if (typeof proof?.photoData !== 'string' || !/^data:image\/(?:jpeg|png|webp);base64,/.test(proof.photoData) || proof.photoData.length > 900000) fail('Attach a valid proof photo under 650 KB');
  if (typeof proof.receiverName !== 'string' || !proof.receiverName.trim() || proof.receiverName.trim().length > 80 || typeof proof.receiverSignature !== 'string' || !proof.receiverSignature.trim() || proof.receiverSignature.trim().length > 120) fail('Receiver name and signature confirmation are required');
}

export async function changeAssignment(jobId, actorId, action, reason, isAdmin = false) {
  if (typeof reason !== 'string' || reason.trim().length < 10 || reason.length > 500) fail('Explain the reason in 10–500 characters');
  const job = await mongoose.connection.transaction(async (session) => {
    const job = await DeliveryJob.findOne({ _id: jobId, ...(isAdmin ? {} : { assignedDriver: actorId }), status: { $in: ['accepted', 'collecting', 'inTransit', 'paused'] } }).session(session);
    if (!job) fail('Active delivery not found', 404);
    if (action === 'pause') {
      if (job.status === 'paused') fail('Delivery is already paused', 409);
      job.resumeStatus = job.status; job.status = 'paused'; job.pauseReason = reason.trim();
      await DeliveryIssue.create([{ job: job._id, driver: job.assignedDriver, issueType: 'vehicle', description: reason.trim() }], { session });
    } else {
      const cargoCollected = job.status === 'inTransit' || job.pickupPoints.some((point) => point.completedAt) || job.resumeStatus === 'inTransit';
      if (!isAdmin && (cargoCollected || job.status === 'paused')) fail('Cargo has been collected or the trip is paused. Request administrator reassignment.', 409);
      job.assignmentHistory.push({ driver: job.assignedDriver, endedAt: new Date(), reason: reason.trim() });
      await DriverProfile.updateOne({ user: job.assignedDriver }, { $set: { availabilityStatus: 'available' } }, { session });
      job.resumeStatus = cargoCollected ? (job.pickupPoints.every((point) => point.completedAt) ? 'inTransit' : 'collecting') : 'accepted';
      job.assignedDriver = undefined; job.vehicle = undefined; job.acceptedAt = undefined;
      job.status = 'available'; job.pauseReason = undefined;
    }
    job.driverLocation = undefined;
    job.trackingSessionId = undefined;
    await job.save({ session }); return job;
  });
  await notify(job.createdBy, action === 'pause' ? `Delivery ${job.jobCode} is paused: ${reason}` : `Delivery ${job.jobCode} is available for a replacement driver: ${reason}`, `assignment:${job._id}:${job.updatedAt.toISOString()}`);
  return job;
}

export async function returnStop(jobId, driverId, index, proof, operationId) {
  validateProof(proof);
  return mongoose.connection.transaction(async (session) => {
    const job = await DeliveryJob.findOne({ _id: jobId, assignedDriver: driverId }).session(session);
    const point = job?.dropoffPoints[index];
    if (point?.returnCompletedAt && operationId && point.returnOperationId === operationId) return job;
    if (job?.status !== 'inTransit') fail('Return goods during an active trip', 409);
    if (!point || !['failed', 'partial'].includes(point.outcome) || point.returnCompletedAt) fail('Returnable stop not found', 409);
    for (const id of point.orders) {
      const order = await Order.findById(id).session(session);
      if (!order) fail('Order not found', 409);
      const delivered = point.deliveredQuantities.find((item) => String(item.order) === String(id))?.quantity ?? 0;
      const returned = order.quantity - delivered;
      if (order.stockReserved && returned > 0) {
        const product = await Product.findById(order.product).session(session);
        if (!product) fail('Product not found. Contact an administrator.', 409);
        product.availableQuantity += returned;
        if (product.status === 'sold') product.status = 'active';
        await product.save({ session });
      }
      order.stockReserved = false; order.status = 'returned'; order.deliveredQuantity = delivered;
      await order.save({ session });
    }
    point.returnCompletedAt = new Date(); point.returnPhotoData = proof.photoData; point.returnOperationId = operationId;
    point.returnReceiverName = proof.receiverName.trim(); point.returnReceiverSignature = proof.receiverSignature.trim();
    await job.save({ session }); return job;
  });
}
