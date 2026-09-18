import mongoose from 'mongoose';
import { saveDeliveryJob, removeDeliveryJob } from '../../services/deliveries.js';
import { fail } from '../../services/bidding.js';
import { notify } from '../../services/notifications.js';
import DeliveryJob, { DELIVERY_JOB_STATUSES } from '../../models/DeliveryJob.js';
import DriverProfile from '../../models/DriverProfile.js';
import Order from '../../models/Order.js';
import Vehicle from '../../models/Vehicle.js';
import {
  isPositiveNumber,
  isValidMongoId,
} from '../../utils/validation.js';

const JOB_FIELDS = [
  'orders',
  'pickupPoints',
  'destination',
  'cargoDescription',
  'totalWeightKg',
  'routeDistanceKm',
  'payoutAmount',
  'scheduledPickupAt',
  'sharedDelivery',
];

const ACTIVE_JOB_STATUSES = ['accepted', 'collecting', 'inTransit'];
const STATUS_TRANSITIONS = {
  accepted: 'collecting',
  collecting: 'inTransit',
  inTransit: 'delivered',
};
const STATUS_TIMESTAMPS = {
  collecting: 'pickupArrivedAt',
  inTransit: 'transitStartedAt',
  delivered: 'deliveredAt',
};

function jobData(body) {
  return JOB_FIELDS.reduce((job, field) => {
    if (body[field] !== undefined) {
      job[field] = body[field];
    }
    return job;
  }, {});
}

function validateJobNumbers(data) {
  if (data.totalWeightKg !== undefined && !isPositiveNumber(data.totalWeightKg)) {
    return 'Total cargo weight must be a positive number';
  }
  if (
    data.payoutAmount !== undefined &&
    (typeof data.payoutAmount !== 'number' || !Number.isFinite(data.payoutAmount) || data.payoutAmount < 0)
  ) {
    return 'Driver payout cannot be negative';
  }
  if (
    data.routeDistanceKm !== undefined &&
    (typeof data.routeDistanceKm !== 'number' ||
      !Number.isFinite(data.routeDistanceKm) ||
      data.routeDistanceKm < 0)
  ) {
    return 'Route distance cannot be negative';
  }
  return null;
}

function populateJob(query) {
  return query
    .populate('orders', 'orderCode product quantity unit status deliveryAddress')
    .populate('createdBy', 'name')
    .populate('assignedDriver', 'name')
    .populate('vehicle', 'vehicleType registrationNumber capacityKg');
}

function visibleJob(job) {
  const data = job.toObject();
  if (!data.driverLocation?.recordedAt || Date.now() - data.driverLocation.recordedAt.getTime() > 120000) delete data.driverLocation;
  return data;
}

export async function createDeliveryJob(request, response, next) {
  try {
    const data = jobData(request.body);
    const numberError = validateJobNumbers(data);
    if (numberError) {
      return response.status(400).json({ message: numberError });
    }

    const job = await saveDeliveryJob(data, request.user._id);

    return response.status(201).json({
      message: 'Delivery job created successfully',
      job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerDeliveryJobs(request, response, next) {
  try {
    const { status } = request.query;
    const filter = { createdBy: request.user._id };
    if (status) {
      if (!DELIVERY_JOB_STATUSES.includes(status)) {
        return response.status(400).json({ message: 'Enter a valid delivery job status' });
      }
      filter.status = status;
    }

    const jobs = await populateJob(DeliveryJob.find(filter).sort({ createdAt: -1 }));
    return response.status(200).json({ count: jobs.length, jobs: jobs.map(visibleJob) });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerDeliveryJob(request, response, next) {
  try {
    const { jobId } = request.params;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }

    const job = await populateJob(
      DeliveryJob.findOne({ _id: jobId, createdBy: request.user._id }),
    );
    if (!job) {
      return response.status(404).json({ message: 'Delivery job not found' });
    }

    return response.status(200).json({ job: visibleJob(job) });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmerDeliveryJob(request, response, next) {
  try {
    const { jobId } = request.params;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }

    const data = jobData(request.body);
    if (Object.keys(data).length === 0) {
      return response.status(400).json({ message: 'Provide at least one delivery job field' });
    }

    const numberError = validateJobNumbers(data);
    if (numberError) {
      return response.status(400).json({ message: numberError });
    }
    const job = await saveDeliveryJob(data, request.user._id, jobId);

    return response.status(200).json({
      message: 'Delivery job updated successfully',
      job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteFarmerDeliveryJob(request, response, next) {
  try {
    const { jobId } = request.params;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }

    await removeDeliveryJob(jobId, request.user._id);

    return response.status(200).json({ message: 'Delivery job deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function getDriverDeliveryJobs(request, response, next) {
  try {
    const { district, scope = 'available', status } = request.query;
    if (!['available', 'mine'].includes(scope)) {
      return response.status(400).json({ message: 'Job scope must be available or mine' });
    }

    const filter =
      scope === 'mine'
        ? { assignedDriver: request.user._id }
        : { status: 'available', assignedDriver: { $exists: false } };

    if (scope === 'mine' && status) {
      if (!DELIVERY_JOB_STATUSES.includes(status)) {
        return response.status(400).json({ message: 'Enter a valid delivery job status' });
      }
      filter.status = status;
    }
    if (district?.trim()) {
      filter.$or = [
        { 'pickupPoints.district': district.trim() },
        { 'destination.district': district.trim() },
        { 'dropoffPoints.district': district.trim() },
      ];
    }

    const jobs = await populateJob(
      DeliveryJob.find(filter).sort({ scheduledPickupAt: 1, createdAt: -1 }),
    );
    return response.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    return next(error);
  }
}

export async function getDriverDeliveryJob(request, response, next) {
  try {
    const { jobId } = request.params;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }

    const job = await populateJob(
      DeliveryJob.findOne({
        _id: jobId,
        $or: [
          { status: 'available', assignedDriver: { $exists: false } },
          { assignedDriver: request.user._id },
        ],
      }),
    );
    if (!job) {
      return response.status(404).json({ message: 'Delivery job not found' });
    }

    return response.status(200).json({ job });
  } catch (error) {
    return next(error);
  }
}

export async function acceptDeliveryJob(request, response, next) {
  try {
    const { jobId } = request.params;
    const { vehicleId } = request.body;
    if (!isValidMongoId(jobId) || !isValidMongoId(vehicleId)) {
      return response.status(400).json({ message: 'Enter valid delivery job and vehicle IDs' });
    }

    const profile = await DriverProfile.findOne({
      user: request.user._id,
      availabilityStatus: 'available',
    });
    if (!profile) {
      return response.status(409).json({
        message: 'Set your completed driver profile to available before accepting jobs',
      });
    }

    const activeJob = await DeliveryJob.exists({
      assignedDriver: request.user._id,
      status: { $in: ACTIVE_JOB_STATUSES },
    });
    if (activeJob) {
      return response.status(409).json({ message: 'Complete your active delivery first' });
    }

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      driver: request.user._id,
      isActive: true,
    });
    if (!vehicle) {
      return response.status(404).json({ message: 'Active vehicle not found' });
    }

    const availableJob = await DeliveryJob.findOne({
      _id: jobId,
      status: 'available',
      assignedDriver: { $exists: false },
    });
    if (!availableJob) {
      return response.status(409).json({ message: 'This delivery job is no longer available' });
    }
    if (vehicle.capacityKg < availableJob.totalWeightKg) {
      return response.status(400).json({
        message: 'Selected vehicle does not have enough cargo capacity',
      });
    }

    const job = await mongoose.connection.transaction(async (session) => {
      const claimed = await DriverProfile.updateOne({ user: request.user._id, availabilityStatus: 'available' }, { $set: { availabilityStatus: 'busy' } }, { session });
      if (!claimed.modifiedCount) fail('Driver is no longer available', 409);
      const orders = await Order.find({ _id: { $in: availableJob.orders } }).session(session);
      if (orders.length !== availableJob.orders.length || orders.some((order) => !['preparing', 'dispatched'].includes(order.status))) fail('An order is no longer ready for pickup', 409);
      if (orders.some((order) => order.deliveryJob && String(order.deliveryJob) !== String(availableJob._id))) fail('An order is claimed by another delivery', 409);
      for (const order of orders) await Order.updateOne({ _id: order._id }, { $set: { deliveryJob: availableJob._id } }, { session });
      const assigned = await DeliveryJob.findOneAndUpdate(
        { _id: jobId, status: 'available', assignedDriver: { $exists: false } },
        { $set: { assignedDriver: request.user._id, vehicle: vehicle._id, status: 'accepted', acceptedAt: new Date() }, $push: { statusUpdates: { status: 'accepted', note: 'Delivery job accepted' } } },
        { new: true, runValidators: true, session },
      );
      if (!assigned) fail('Another driver accepted this job first', 409);
      return assigned;
    });

    await notify(availableJob.createdBy, `A driver accepted delivery ${job.jobCode}.`, `driver-assigned:${job._id}`);
    const recipients = await Order.find({ _id: { $in: availableJob.orders } }).distinct('buyer');
    for (const buyer of recipients) await notify(buyer, `A driver was assigned to your delivery ${job.jobCode}.`, `driver-assigned:${job._id}`);

    return response.status(200).json({
      message: 'Delivery job accepted successfully',
      job,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateDeliveryJobStatus(request, response, next) {
  try {
    const { jobId } = request.params;
    const { note, proof, status } = request.body;
    if (!isValidMongoId(jobId)) {
      return response.status(400).json({ message: 'Enter a valid delivery job ID' });
    }
    if (!['collecting', 'inTransit', 'delivered'].includes(status)) {
      return response.status(400).json({ message: 'Enter a valid active delivery status' });
    }
    if (note !== undefined && (typeof note !== 'string' || note.trim().length > 500)) {
      return response.status(400).json({ message: 'Status note cannot exceed 500 characters' });
    }

    const currentJob = await DeliveryJob.findOne({
      _id: jobId,
      assignedDriver: request.user._id,
      status: { $in: ACTIVE_JOB_STATUSES },
    });
    if (!currentJob) {
      return response.status(404).json({ message: 'Active delivery job not found' });
    }
    if (STATUS_TRANSITIONS[currentJob.status] !== status) {
      return response.status(409).json({
        message: `The next delivery status must be ${STATUS_TRANSITIONS[currentJob.status]}`,
      });
    }

    if (status === 'collecting' && currentJob.scheduledPickupAt > new Date()) fail('The scheduled pickup time has not arrived yet', 409);
    if (status === 'inTransit' && currentJob.pickupPoints.some((point) => !point.completedAt)) fail('Confirm every pickup stop before starting transit', 409);
    if (status === 'delivered' && currentJob.dropoffPoints?.length && currentJob.dropoffPoints.some((point) => !point.completedAt)) fail('Confirm every drop-off before completing the trip', 409);

    const updateTime = new Date();
    const update = {
      $set: {
        status,
        [STATUS_TIMESTAMPS[status]]: updateTime,
      },
      $push: {
        statusUpdates: {
          status,
          note: note?.trim() || undefined,
          recordedAt: updateTime,
        },
      },
    };

    if (status === 'delivered') {
      const photoData = proof?.photoData;
      const receiverName = proof?.receiverName?.trim();
      const receiverSignature = proof?.receiverSignature?.trim();
      if (
        typeof photoData !== 'string' ||
        !/^data:image\/(?:jpeg|png|webp);base64,/.test(photoData) ||
        photoData.length > 900000
      ) {
        return response.status(400).json({ message: 'Attach a valid proof photo under 650 KB' });
      }
      if (!receiverName || !receiverSignature) {
        return response.status(400).json({
          message: 'Receiver name and signature confirmation are required',
        });
      }
      update.$set.deliveryProof = {
        photoData,
        photoAttached: true,
        receiverName,
        receiverSignature,
        confirmedAt: updateTime,
      };
    }

    const job = await mongoose.connection.transaction(async (session) => {
      const changed = await DeliveryJob.findOneAndUpdate(
        { _id: currentJob._id, assignedDriver: request.user._id, status: currentJob.status },
        { ...update, ...(status === 'delivered' ? { $unset: { driverLocation: '' } } : {}) },
        { new: true, runValidators: true, session },
      );
      if (!changed) fail('Delivery status changed; refresh and try again', 409);
      await Order.updateMany({ _id: { $in: currentJob.orders }, status: { $ne: 'cancelled' } }, { $set: { status: status === 'collecting' ? 'dispatched' : status } }, { session });
      if (status === 'delivered') await DriverProfile.updateOne({ user: request.user._id }, { $set: { availabilityStatus: 'available' } }, { session });
      return changed;
    });

    return response.status(200).json({
      message: 'Delivery status updated successfully',
      job,
    });
  } catch (error) {
    return next(error);
  }
}
