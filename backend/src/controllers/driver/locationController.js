import DeliveryJob from '../../models/DeliveryJob.js';
import Order from '../../models/Order.js';
import { fail } from '../../services/bidding.js';
import { isValidMongoId, validCoordinates } from '../../utils/validation.js';

export async function shareLocation(request, response, next) {
  try {
    if (!isValidMongoId(request.params.jobId)) fail('Invalid delivery ID');
    const { latitude, longitude, sharing } = request.body;
    if (sharing !== false && !validCoordinates(latitude, longitude)) fail('Provide valid latitude and longitude');
    const job = await DeliveryJob.findOneAndUpdate({ _id: request.params.jobId, assignedDriver: request.user._id, status: { $in: ['accepted', 'collecting', 'inTransit'] } },
      sharing === false ? { $unset: { driverLocation: '' } } : { $set: { driverLocation: { latitude, longitude, recordedAt: new Date() } } }, { new: true, runValidators: true });
    if (!job) fail('Active assigned delivery not found', 404);
    return response.json({ location: job.driverLocation ?? null });
  } catch (error) { return next(error); }
}

export async function completeStop(request, response, next) {
  try {
    const { kind, index, receiverName } = request.body;
    if (!isValidMongoId(request.params.jobId) || !['pickup', 'dropoff'].includes(kind) || !Number.isInteger(index) || index < 0 || index > 24) fail('Select a valid stop');
    if (kind === 'dropoff' && (typeof receiverName !== 'string' || !receiverName.trim() || receiverName.trim().length > 80)) fail('Enter the receiver name for this drop-off');
    const field = kind === 'pickup' ? 'pickupPoints' : 'dropoffPoints';
    const job = await DeliveryJob.findOneAndUpdate({
      _id: request.params.jobId, assignedDriver: request.user._id,
      status: kind === 'pickup' ? 'collecting' : 'inTransit',
      [`${field}.${index}`]: { $exists: true }, [`${field}.${index}.completedAt`]: { $exists: false },
    }, { $set: { [`${field}.${index}.completedAt`]: new Date(), ...(kind === 'dropoff' ? { [`${field}.${index}.receiverName`]: receiverName.trim() } : {}) } }, { new: true, runValidators: true });
    if (!job) fail('Stop not available or already completed', 409);
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
