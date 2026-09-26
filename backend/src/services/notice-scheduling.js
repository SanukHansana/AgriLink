import Notice from '../models/Notice.js';
import User from '../models/User.js';
import FarmerProfile from '../models/FarmerProfile.js';
import Notification from '../models/Notification.js';
import { fail } from './bidding.js';
import { districtPattern } from './officer-access.js';
import { parseValidDate } from '../utils/validation.js';

export function liveNoticeFilter(now = new Date()) {
  return { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };
}

export function validateNoticeSchedule(data, now = new Date()) {
  for (const field of ['scheduledPublishAt', 'expiresAt']) {
    if (data[field] === undefined) continue;
    if (data[field] === null || data[field] === '') { data[field] = null; continue; }
    const date = parseValidDate(data[field]);
    if (!date || date <= now) fail(`${field === 'expiresAt' ? 'Expiry' : 'Publishing'} time must be in the future`);
    data[field] = date;
  }
  if (data.expiresAt && data.scheduledPublishAt && data.expiresAt <= data.scheduledPublishAt) fail('Expiry must be after the scheduled publishing time');
}

export async function broadcastNotice(notice) {
  const filter = { role: 'farmer', isActive: true };
  if (notice.targetAudience === 'district') {
    const farmers = await FarmerProfile.find({ 'farmLocation.district': districtPattern(notice.targetDistrict) }).distinct('user');
    filter._id = { $in: farmers };
  }
  // Stream recipients instead of loading the entire user collection in memory.
  const cursor = User.find(filter).select('_id').cursor();
  let batch = [];
  const flush = async () => { if (batch.length) { await Notification.bulkWrite(batch, { ordered: false }); batch = []; } };
  for await (const farmer of cursor) {
    batch.push({ updateOne: { filter: { user: farmer._id, eventKey: `notice:${notice._id}` }, update: { $setOnInsert: { message: `${notice.isEmergency ? 'Emergency notice' : 'Agriculture notice'}: ${notice.title}. Open Agriculture Updates to read it.` } }, upsert: true } });
    if (batch.length >= 100) await flush();
  }
  await flush();
  await Notice.updateOne({ _id: notice._id }, { $set: { notificationPending: false } });
}

export async function processNotices(now = new Date()) {
  await Notice.updateMany({ status: { $in: ['scheduled', 'published'] }, expiresAt: { $lte: now, $ne: null } }, { $set: { status: 'archived', notificationPending: false } });
  const due = await Notice.find({ status: 'scheduled', scheduledPublishAt: { $lte: now }, ...liveNoticeFilter(now) }).limit(50);
  for (const notice of due) {
    const author = await User.findOne({ _id: notice.officer, role: 'agricultureOfficer', isActive: true, isVerified: true });
    if (!author?.officerDistrict) continue;
    if (notice.targetAudience === 'district' && !districtPattern(author.officerDistrict).test(notice.targetDistrict)) continue;
    await Notice.updateOne({ _id: notice._id, status: 'scheduled' }, { $set: { status: 'published', publishedAt: now, notificationPending: true } });
  }
  const pending = await Notice.find({ status: 'published', notificationPending: true, ...liveNoticeFilter(now) }).limit(20);
  for (const notice of pending) await broadcastNotice(notice);
}

export function startNoticeWorker() {
  let running = false;
  const run = async () => { if (running) return; running = true; try { await processNotices(); } catch (error) { console.error('Notice worker failed:', error.message); } finally { running = false; } };
  const timer = setInterval(run, 30000); timer.unref(); void run();
  return () => clearInterval(timer);
}
