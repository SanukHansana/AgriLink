import mongoose from 'mongoose';
import DeliveryJob from '../../models/DeliveryJob.js';
import DriverProfile from '../../models/DriverProfile.js';
import DeliveryIssue from '../../models/DeliveryIssue.js';
import { changeAssignment, returnStop } from '../../services/driver-workflows.js';
import { isValidMongoId } from '../../utils/validation.js';
import { fail } from '../../services/bidding.js';
import { notify } from '../../services/notifications.js';

export async function driverRecovery(request, response, next) {
  try {
    const { action, reason, index, proof, operationId } = request.body;
    if (!isValidMongoId(request.params.jobId)) fail('Invalid delivery ID');
    let job;
    if (['release', 'pause'].includes(action)) job = await changeAssignment(request.params.jobId, request.user._id, action, reason);
    else if (action === 'return' && Number.isInteger(index) && index >= 0) job = await returnStop(request.params.jobId, request.user._id, index, proof, operationId);
    else if (action === 'finishExceptions') job = await mongoose.connection.transaction(async (session) => {
      const job = await DeliveryJob.findOne({ _id: request.params.jobId, assignedDriver: request.user._id, status: 'inTransit' }).session(session);
      if (!job?.dropoffPoints.length || job.dropoffPoints.some((point) => !point.completedAt || (point.outcome !== 'delivered' && !point.returnCompletedAt)) || !job.dropoffPoints.some((point) => point.outcome !== 'delivered')) fail('Complete all stops and return undelivered goods before closing this trip', 409);
      job.status = 'completedWithIssues'; job.payoutStatus = 'onHold'; job.deliveredAt = new Date(); job.driverLocation = undefined;
      await job.save({ session });
      await DriverProfile.updateOne({ user: request.user._id }, { $set: { availabilityStatus: 'available' } }, { session }); return job;
    });
    else fail('Select a valid recovery action');
    return response.json({ job });
  } catch (error) { return next(error); }
}

export async function reviewDriverIssue(request, response, next) {
  try {
    const { status, resolution } = request.body;
    if (!isValidMongoId(request.params.id) || !['inReview', 'resolved'].includes(status) || typeof resolution !== 'string' || resolution.trim().length < 10 || resolution.length > 1000) fail('Provide a valid review status and a resolution note of 10–1000 characters');
    const issue = await DeliveryIssue.findOneAndUpdate({ _id: request.params.id, status: { $ne: 'resolved' } }, { $set: { status, resolution: resolution.trim(), resolvedAt: status === 'resolved' ? new Date() : undefined } }, { new: true, runValidators: true });
    if (!issue) fail('Open issue not found', 409);
    await notify(issue.driver, `Your delivery issue is ${status}: ${resolution}`, `issue-review:${issue._id}:${issue.updatedAt.toISOString()}`);
    return response.json({ issue });
  } catch (error) { return next(error); }
}

export async function adminRecovery(request, response, next) {
  try {
    if (!isValidMongoId(request.params.id) || request.body.custodyConfirmed !== true) fail('Confirm cargo handover or that collection has not started');
    const job = await changeAssignment(request.params.id, request.user._id, 'release', request.body.reason, true);
    return response.json({ job });
  } catch (error) { return next(error); }
}

export async function recordPayment(request, response, next) {
  try {
    const { reference } = request.body;
    if (!isValidMongoId(request.params.id) || typeof reference !== 'string' || reference.trim().length < 3 || reference.length > 120) fail('Enter a payment reference of 3–120 characters');
    const job = await DeliveryJob.findOneAndUpdate({ _id: request.params.id, status: { $in: ['delivered', 'completedWithIssues'] }, payoutStatus: { $ne: 'paid' } }, { $set: { payoutStatus: 'paid', paidAt: new Date(), paidBy: request.user._id, paymentReference: reference.trim() } }, { new: true, runValidators: true });
    if (!job) fail('Unpaid completed delivery not found', 409);
    await notify(job.assignedDriver, `Payment for ${job.jobCode} was recorded. Reference: ${reference.trim()}.`, `payment:${job._id}`);
    return response.json({ job });
  } catch (error) { return next(error); }
}
