import { notify } from '../../services/notifications.js';
import mongoose from 'mongoose';
import AssistanceRequest from '../../models/AssistanceRequest.js';
import { requestScope, assertOfficerOwnsRequest } from '../../services/officer-access.js';
import { fail } from '../../services/bidding.js';
import { isValidMongoId, parseValidDate } from '../../utils/validation.js';

export function validateVisitChange(body, now = new Date()) {
  if (!['complete', 'cancel', 'reschedule'].includes(body.action)) fail('Select a valid visit action');
  const date = parseValidDate(body.scheduledAt);
  const followUp = parseValidDate(body.followUpAt);
  if (body.action === 'reschedule' && (!date || date <= now)) fail('Select a future visit time');
  if (body.action === 'complete' && (typeof body.findings !== 'string' || body.findings.trim().length < 10 || body.findings.length > 2000)) fail('Record findings in 10–2000 characters');
  if (body.followUpAt && (!followUp || followUp <= now)) fail('Select a future follow-up time');
  if (body.followUpNotes && (typeof body.followUpNotes !== 'string' || body.followUpNotes.length > 1000)) fail('Follow-up notes must be 1000 characters or fewer');
  return { date, followUp };
}

export async function getFieldVisits(request, response, next) {
  try {
    const requests = await AssistanceRequest.find({ ...requestScope(request.user), assignedOfficer: request.user._id }).populate('farmer', 'name');
    const visits = requests.flatMap((record) => {
      const legacy = record.responses.filter((item) => item.scheduledVisitAt && !record.visits.some((visit) => String(visit.sourceResponse) === String(item._id))).map((item) => ({ _id: item._id, sourceResponse: item._id, scheduledAt: item.scheduledVisitAt, status: 'scheduled', scheduledBy: item.respondedBy }));
      return [...record.visits.map((visit) => visit.toObject()), ...legacy].map((visit) => ({ ...visit, requestId: record._id, title: record.title, farmer: record.farmer, farmLocation: record.farmLocation }));
    });
    visits.sort((a, b) => a.scheduledAt - b.scheduledAt);
    return response.json({ visits });
  } catch (error) { return next(error); }
}

export async function changeFieldVisit(request, response, next) {
  try {
    if (!isValidMongoId(request.params.requestId) || !isValidMongoId(request.params.visitId)) fail('Invalid request or visit ID');
    const { date, followUp } = validateVisitChange(request.body);
    const record = await mongoose.connection.transaction(async (session) => {
      const record = await AssistanceRequest.findOne({ _id: request.params.requestId, ...requestScope(request.user) }).session(session);
      if (!record) fail('Request not found', 404);
      assertOfficerOwnsRequest(request.user, record);
      let visit = record.visits.id(request.params.visitId);
      if (!visit) {
        const oldResponse = record.responses.id(request.params.visitId);
        if (oldResponse?.scheduledVisitAt) { record.visits.push({ _id: oldResponse._id, sourceResponse: oldResponse._id, scheduledAt: oldResponse.scheduledVisitAt, scheduledBy: request.user._id }); visit = record.visits.id(request.params.visitId); }
      }
      if (!visit || visit.status !== 'scheduled') fail('Scheduled visit not found', 409);
      const action = request.body.action;
      if (action === 'complete') {
        if (visit.scheduledAt > new Date()) fail('Visit time has not arrived yet');
        visit.status = 'completed'; visit.completedAt = new Date(); visit.findings = request.body.findings.trim();
        visit.followUpAt = followUp; visit.followUpNotes = request.body.followUpNotes;
        if (followUp) record.visits.push({ scheduledAt: followUp, scheduledBy: request.user._id, followUpNotes: request.body.followUpNotes });
        else record.status = 'resolved';
      } else if (action === 'cancel') visit.status = 'cancelled';
      else visit.scheduledAt = date;
      record.history.push({ action: `visit-${action}`, actor: request.user._id, toStatus: record.status });
      await record.save({ session }); return record;
    });
    await notify(record.farmer, `Field visit for ${record.title}: ${request.body.action}${date ? ' to ' + date.toISOString() : ''}${followUp ? '. Follow-up: ' + followUp.toISOString() : ''}.`, `visit:${request.params.visitId}:${record.updatedAt.toISOString()}`);
    return response.json({ request: record });
  } catch (error) { return next(error); }
}
