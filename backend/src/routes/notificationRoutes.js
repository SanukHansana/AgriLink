import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';
import { isValidMongoId } from '../utils/validation.js';
import PushDevice from '../models/PushDevice.js';
import { validPushToken } from '../services/push-notifications.js';

const router = Router();
router.use(requireAuth);
router.post('/devices', async (request, response) => {
  if (!validPushToken(request.body.token)) return response.status(400).json({ message: 'Invalid Expo push token' });
  const language = request.body.language ?? 'en';
  if (!['en', 'si', 'ta'].includes(language)) return response.status(400).json({ message: 'Select a valid language' });
  // A phone that switches accounts belongs to its most recently signed-in user.
  await PushDevice.findOneAndUpdate({ token: request.body.token }, { $set: { user: request.user._id, language } }, { upsert: true, runValidators: true });
  return response.json({ registered: true });
});
router.delete('/devices', async (request, response) => {
  if (!validPushToken(request.body.token)) return response.status(400).json({ message: 'Invalid Expo push token' });
  await PushDevice.deleteOne({ token: request.body.token, user: request.user._id });
  return response.json({ registered: false });
});
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
