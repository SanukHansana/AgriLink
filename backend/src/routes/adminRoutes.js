import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

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
  ['users', User, 'name email role isActive createdAt', null],
  ['products', Product, 'name category status farmer createdAt', 'farmer'],
  ['orders', Order, 'orderCode status totalAmount buyer seller createdAt', 'buyer seller'],
]) {
  router.get(`/${path}`, async (request, response) => {
    const page = Math.max(1, Math.min(100000, Number.parseInt(request.query.page, 10) || 1));
    let query = model.find().select(fields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25);
    if (populate) query = query.populate(populate, 'name email');
    const [items, total] = await Promise.all([query.lean(), model.countDocuments()]);
    response.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 25)) });
  });
}

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
