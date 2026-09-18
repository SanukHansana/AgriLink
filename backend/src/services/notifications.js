import Notification from '../models/Notification.js';

export async function notify(user, message, eventKey) {
  // Notification failure must not make a committed order appear to have failed.
  try { await Notification.updateOne({ user, eventKey }, { $setOnInsert: { message } }, { upsert: true, runValidators: true }); }
  catch (error) { console.error('Unable to save notification:', error.message); }
}
