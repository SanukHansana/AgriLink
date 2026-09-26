import { fail } from './bidding.js';

export function districtPattern(district) {
  return new RegExp(`^${String(district).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export function officerDistrict(user) {
  if (user.role !== 'agricultureOfficer' || !user.isVerified) fail('Verified officer access is required', 403);
  if (!user.officerDistrict?.trim()) fail('Ask an administrator to assign your service district', 403);
  return user.officerDistrict.trim();
}

export function requestScope(user) {
  return user.role === 'farmer' ? { farmer: user._id } : { 'farmLocation.district': districtPattern(officerDistrict(user)) };
}

export function assertOfficerOwnsRequest(user, request) {
  if (!districtPattern(officerDistrict(user)).test(request.farmLocation.district)) fail('Request is outside your assigned district', 403);
  if (request.assignedOfficer && String(request.assignedOfficer) !== String(user._id)) fail('This request is assigned to another officer. Ask an administrator to reassign it.', 409);
  if (['rejected', 'resolved'].includes(request.status)) fail('This request is closed', 409);
}

export function safeAttachmentUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
