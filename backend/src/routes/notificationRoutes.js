import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import { isValidMongoId } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (request, response) => {
  const notifications = await Notification.find({ user: request.user._id }).sort({ createdAt: -1 }).limit(50);
  response.json({ notifications });
});
router.patch('/:id/read', async (request, response) => {
  if (!isValidMongoId(request.params.id)) return response.status(400).json({ message: 'Invalid notification ID' });
  const notification = await Notification.findOneAndUpdate({ _id: request.params.id, user: request.user._id }, { $set: { readAt: new Date() } }, { new: true });
  if (!notification) return response.status(404).json({ message: 'Notification not found' });
  return response.json({ notification });
});
export default router;
