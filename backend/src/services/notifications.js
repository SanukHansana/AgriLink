import Notification from '../models/Notification.js';
import { sendPhoneNotification } from './push-notifications.js';

export async function notify(user, message, eventKey) {
  // Notification failure must not make a committed order appear to have failed.
  try {
    const result = await Notification.updateOne({ user, eventKey }, { $setOnInsert: { message } }, { upsert: true, runValidators: true });
    // Existing event keys must not produce another phone alert.
    if (result?.upsertedCount) {
      try { await sendPhoneNotification(user, message, eventKey); }
      catch (error) { console.error('Unable to send phone notification:', error.message); }
    }
  }
  catch (error) { console.error('Unable to save notification:', error.message); }
}
