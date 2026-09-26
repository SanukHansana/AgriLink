import User from '../models/User.js';
import { districtPattern } from './officer-access.js';
import { notify } from './notifications.js';

export async function notifyDistrictOfficers(record) {
  const officers = await User.find({ role: 'agricultureOfficer', isActive: true, isVerified: true, officerDistrict: districtPattern(record.farmLocation.district) }).distinct('_id');
  for (const officer of officers) await notify(officer, `Farmer assistance request: ${record.title}.`, `assistance:${record._id}:${record.updatedAt.toISOString()}`);
}

export async function bestEffortNotification(work) {
  try { await work(); } catch (error) { console.error('Advisory notification failed:', error.message); }
}
