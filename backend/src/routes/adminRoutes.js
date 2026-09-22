import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import DeliveryIssue from '../models/DeliveryIssue.js';
import DeliveryJob from '../models/DeliveryJob.js';
import { reviewDriverIssue, adminRecovery, recordPayment } from '../controllers/driver/workflowController.js';
import AssistanceRequest from '../models/AssistanceRequest.js';
import ReportedListing from '../models/ReportedListing.js';
import { districtPattern } from '../services/officer-access.js';

const assignmentModels = { requests: AssistanceRequest, reports: ReportedListing };

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.patch('/officers/:id/district', async (request, response) => {
  const district = request.body.district;
  if (!mongoose.isValidObjectId(request.params.id) || typeof district !== 'string' || !district.trim() || district.length > 80) return response.status(400).json({ message: 'Provide an officer ID and service district' });
  const user = await User.findOneAndUpdate({ _id: request.params.id, role: 'agricultureOfficer' }, { $set: { officerDistrict: district.trim() } }, { new: true, runValidators: true });
  if (!user) return response.status(404).json({ message: 'Officer not found' });
  return response.json({ user });
});
router.patch('/officer-assignments/:kind/:id', async (request, response) => {
  const model = assignmentModels[request.params.kind];
  if (!model || !mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.body.officerId)) return response.status(400).json({ message: 'Provide valid case and officer IDs' });
  const officer = await User.findOne({ _id: request.body.officerId, role: 'agricultureOfficer', isVerified: true, isActive: true });
  if (!officer?.officerDistrict) return response.status(400).json({ message: 'Assign a district to an active verified officer first' });
  let filter = { _id: request.params.id, status: { $nin: ['resolved', 'rejected', 'dismissed'] } };
  if (request.params.kind === 'requests') filter['farmLocation.district'] = districtPattern(officer.officerDistrict);
  else {
    const products = await Product.find({ 'farmLocation.district': districtPattern(officer.officerDistrict) }).distinct('_id');
    filter.product = { $in: products };
  }
  const record = await model.findOneAndUpdate(filter, { $set: { assignedOfficer: officer._id }, $push: { history: { action: 'reassigned', actor: request.user._id, recordedAt: new Date() } } }, { new: true });
  if (!record) return response.status(409).json({ message: 'Open case not found in the officer’s district' });
  return response.json({ record });
});
router.patch('/driver-issues/:id', reviewDriverIssue);
router.post('/deliveries/:id/reassign', adminRecovery);
router.post('/deliveries/:id/payment', recordPayment);
router.get('/driver-issues/:id/photo', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid issue ID' });
  const issue = await DeliveryIssue.findById(request.params.id).select('+photoData');
  if (!issue) return response.status(404).json({ message: 'Issue not found' });
  return response.json({ photoData: issue.photoData ?? null });
});

router.get('/overview', async (_request, response) => {
  const [users, activeUsers, listings, activeListings, orders, pendingOrders, delivered] = await Promise.all([
    User.countDocuments(), User.countDocuments({ isActive: true }),
    Product.countDocuments(), Product.countDocuments({ status: 'active' }),
    Order.countDocuments(), Order.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
  ]);
  response.json({ users, activeUsers, listings, activeListings, orders, pendingOrders, deliveredValue: delivered[0]?.total ?? 0 });
});

// Paginated collections never expose password hashes or full order addresses.
for (const [path, model, fields, populate] of [
  ['users', User, 'name email role isActive isVerified officerDistrict verifiedAt createdAt', null],
  ['officer-requests', AssistanceRequest, 'title farmer farmLocation status assignedOfficer createdAt', 'farmer assignedOfficer'],
  ['officer-reports', ReportedListing, 'product farmer status assignedOfficer createdAt', 'farmer assignedOfficer'],
  ['products', Product, 'name category status farmer createdAt', 'farmer'],
  ['orders', Order, 'orderCode status totalAmount buyer seller createdAt', 'buyer seller'],
  ['driver-issues', DeliveryIssue, 'job driver issueType description status resolution photoAttached createdAt', 'driver job'],
  ['deliveries', DeliveryJob, 'jobCode status assignedDriver payoutAmount payoutStatus paidAt paymentReference pauseReason createdAt', 'assignedDriver'],
]) {
  router.get(`/${path}`, async (request, response) => {
    const page = Math.max(1, Math.min(100000, Number.parseInt(request.query.page, 10) || 1));
    let query = model.find().select(fields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25);
    if (path === 'driver-issues') query = query.populate('driver', 'name email').populate('job', 'jobCode status');
    else if (populate) query = query.populate(populate, 'name email');
    const [items, total] = await Promise.all([query.lean(), model.countDocuments()]);
    response.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 25)) });
  });
}

router.patch('/users/:id/verification', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id) || typeof request.body.isVerified !== 'boolean') {
    return response.status(400).json({ message: 'Provide a valid officer ID and verification status' });
  }
  const update = request.body.isVerified
    ? { $set: { isVerified: true, verifiedBy: request.user._id, verifiedAt: new Date() } }
    : { $set: { isVerified: false }, $unset: { verifiedBy: '', verifiedAt: '' } };
  const user = await User.findOneAndUpdate(
    { _id: request.params.id, role: 'agricultureOfficer' }, update,
    { returnDocument: 'after', runValidators: true },
  ).select('name email role isActive isVerified verifiedAt createdAt');
  if (!user) return response.status(404).json({ message: 'Agriculture officer not found' });
  return response.json({ user });
});

router.patch('/users/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id) || typeof request.body.isActive !== 'boolean') {
    return response.status(400).json({ message: 'Provide a valid user ID and activation status' });
  }
  // Protect all administrators from accidental lockout, including concurrent requests.
  const user = await User.findOneAndUpdate(
    { _id: request.params.id, role: { $ne: 'admin' } },
    { $set: { isActive: request.body.isActive } }, { returnDocument: 'after', runValidators: true },
  ).select('name email role isActive createdAt');
  if (!user) return response.status(404).json({ message: 'User not found or administrator account is protected' });
  return response.json({ user });
});

router.patch('/products/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id) || !['active', 'inactive'].includes(request.body.status)) {
    return response.status(400).json({ message: 'Provide a valid listing ID and active or inactive status' });
  }
  const product = await Product.findOneAndUpdate(
    { _id: request.params.id, status: { $in: ['active', 'inactive', 'pending'] } },
    { $set: { status: request.body.status } }, { returnDocument: 'after', runValidators: true },
  );
  if (!product) return response.status(404).json({ message: 'Listing not found or already sold' });
  return response.json({ product });
});

export default router;
