import mongoose from 'mongoose';
import { requestScope, assertOfficerOwnsRequest, safeAttachmentUrl } from '../../services/officer-access.js';
import { fail } from '../../services/bidding.js';
import AssistanceRequest, {
  ASSISTANCE_REQUEST_CATEGORIES,
  ASSISTANCE_REQUEST_PRIORITIES,
  ASSISTANCE_REQUEST_STATUSES,
  OFFICIAL_RESPONSE_TYPES,
} from '../../models/AssistanceRequest.js';
import { isValidMongoId, parseValidDate } from '../../utils/validation.js';

const FARMER_EDITABLE_FIELDS = [
  'category',
  'title',
  'description',
  'farmLocation',
  'farmSizeAcres',
  'attachments',
];

function requestData(body) {
  return FARMER_EDITABLE_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function populateRequest(query, officer = false) {
  if (officer) query = query.select('+internalNotes');
  return query
    .populate('farmer', 'name email')
    .populate('assignedOfficer', 'name email')
    .populate('responses.respondedBy', 'name email');
}

function validateFarmerInput(data) {
  if (data.category && !ASSISTANCE_REQUEST_CATEGORIES.includes(data.category)) {
    return 'Enter a valid assistance request category';
  }
  if (
    data.farmSizeAcres !== undefined &&
    (typeof data.farmSizeAcres !== 'number' ||
      !Number.isFinite(data.farmSizeAcres) ||
      data.farmSizeAcres <= 0)
  ) {
    return 'Farm size must be a positive number';
  }
  if (data.attachments !== undefined && (!Array.isArray(data.attachments) || data.attachments.length > 5 || data.attachments.some((item) => !safeAttachmentUrl(item.url)))) {
    return 'Provide up to five attachments with valid HTTP or HTTPS links';
  }
  return null;
}

export async function createAssistanceRequest(request, response, next) {
  try {
    const data = requestData(request.body);
    const validationError = validateFarmerInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    const assistanceRequest = await AssistanceRequest.create({
      ...data,
      farmer: request.user._id,
    });
    await assistanceRequest.populate('farmer', 'name email');

    return response.status(201).json({
      message: 'Assistance request submitted successfully',
      request: assistanceRequest,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAssistanceRequests(request, response, next) {
  try {
    const { category, district, priority, status } = request.query;
    if (category && !ASSISTANCE_REQUEST_CATEGORIES.includes(category)) {
      return response.status(400).json({ message: 'Enter a valid request category filter' });
    }
    if (priority && !ASSISTANCE_REQUEST_PRIORITIES.includes(priority)) {
      return response.status(400).json({ message: 'Enter a valid request priority filter' });
    }
    if (status && !ASSISTANCE_REQUEST_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid request status filter' });
    }

    const filter = requestScope(request.user);
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (district && request.user.role === 'farmer') filter['farmLocation.district'] = new RegExp(`^${escapeRegex(district)}$`, 'i');

    const requests = await populateRequest(AssistanceRequest.find(filter), request.user.role === 'agricultureOfficer').sort({
      priority: -1,
      createdAt: -1,
    });
    const rank = { high: 3, medium: 2, low: 1 };
    requests.sort((a, b) => rank[b.priority] - rank[a.priority]);
    return response.status(200).json({ requests });
  } catch (error) {
    return next(error);
  }
}

export async function getAssistanceRequest(request, response, next) {
  try {
    const { requestId } = request.params;
    if (!isValidMongoId(requestId)) {
      return response.status(400).json({ message: 'Enter a valid assistance request ID' });
    }

    const assistanceRequest = await populateRequest(
      AssistanceRequest.findOne({
        _id: requestId,
        ...requestScope(request.user),
      }), request.user.role === 'agricultureOfficer',
    );
    if (!assistanceRequest) {
      return response.status(404).json({ message: 'Assistance request not found' });
    }
    return response.status(200).json({ request: assistanceRequest });
  } catch (error) {
    return next(error);
  }
}

export async function updateAssistanceRequest(request, response, next) {
  try {
    const { requestId } = request.params;
    if (!isValidMongoId(requestId)) {
      return response.status(400).json({ message: 'Enter a valid assistance request ID' });
    }

    const updates = requestData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one request field to update' });
    }
    const validationError = validateFarmerInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });

    const assistanceRequest = await AssistanceRequest.findOneAndUpdate(
      {
        _id: requestId,
        farmer: request.user._id,
        status: { $in: ['pending', 'revisionRequired'] },
      },
      { $set: { ...updates, status: 'pending' } },
      { new: true, runValidators: true },
    ).populate('farmer', 'name email');
    if (!assistanceRequest) {
      return response.status(404).json({
        message: 'Editable assistance request not found',
      });
    }

    return response.status(200).json({
      message: 'Assistance request updated successfully',
      request: assistanceRequest,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAssistanceRequest(request, response, next) {
  try {
    const { requestId } = request.params;
    if (!isValidMongoId(requestId)) {
      return response.status(400).json({ message: 'Enter a valid assistance request ID' });
    }

    const assistanceRequest = await AssistanceRequest.findOneAndDelete({
      _id: requestId,
      farmer: request.user._id,
      status: 'pending',
    });
    if (!assistanceRequest) {
      return response.status(404).json({ message: 'Pending assistance request not found' });
    }
    return response.status(200).json({ message: 'Assistance request withdrawn successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function reviewAssistanceRequest(request, response, next) {
  try {
    const { requestId } = request.params;
    const { internalNotes, priority, status } = request.body;
    if (!isValidMongoId(requestId)) {
      return response.status(400).json({ message: 'Enter a valid assistance request ID' });
    }
    if (status && !ASSISTANCE_REQUEST_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid request status' });
    }
    if (priority && !ASSISTANCE_REQUEST_PRIORITIES.includes(priority)) {
      return response.status(400).json({ message: 'Enter a valid request priority' });
    }
    if (status === undefined && priority === undefined && internalNotes === undefined) {
      return response.status(400).json({ message: 'Provide review details to update' });
    }

    const assistanceRequest = await mongoose.connection.transaction(async (session) => {
      const record = await AssistanceRequest.findOne({ _id: requestId, ...requestScope(request.user) }).select('+internalNotes').session(session);
      if (!record) fail('Request not found in your district', 404);
      assertOfficerOwnsRequest(request.user, record);
      const from = record.status;
      const transitions = { pending: ['inReview', 'approved', 'revisionRequired', 'rejected'], inReview: ['inReview', 'approved', 'revisionRequired', 'rejected', 'resolved'], revisionRequired: ['inReview', 'revisionRequired'], approved: ['approved', 'inReview', 'resolved'] };
      if (status && !transitions[from]?.includes(status)) fail('Invalid request status transition', 409);
      record.assignedOfficer = request.user._id;
      if (status !== undefined) record.status = status;
      if (priority !== undefined) record.priority = priority;
      if (internalNotes !== undefined) record.internalNotes = internalNotes;
      record.history.push({ action: 'review', actor: request.user._id, fromStatus: from, toStatus: record.status });
      await record.save({ session }); return record;
    });
    await assistanceRequest.populate([{ path: 'farmer', select: 'name email' }, { path: 'assignedOfficer', select: 'name email' }]);

    return response.status(200).json({
      message: 'Assistance request review updated successfully',
      request: assistanceRequest,
    });
  } catch (error) {
    return next(error);
  }
}

export async function respondToAssistanceRequest(request, response, next) {
  try {
    const { requestId } = request.params;
    const { message, scheduledVisitAt, type } = request.body;
    if (!isValidMongoId(requestId)) {
      return response.status(400).json({ message: 'Enter a valid assistance request ID' });
    }
    if (!OFFICIAL_RESPONSE_TYPES.includes(type)) {
      return response.status(400).json({ message: 'Enter a valid official response type' });
    }

    const visitDate = scheduledVisitAt ? parseValidDate(scheduledVisitAt) : null;
    if (scheduledVisitAt && (!visitDate || visitDate <= new Date())) {
      return response.status(400).json({ message: 'Enter a valid scheduled visit date' });
    }
    if (type === 'approvedAndScheduled' && !visitDate) {
      return response.status(400).json({ message: 'A scheduled visit date is required' });
    }

    const statusByResponse = {
      approved: 'approved',
      approvedAndScheduled: 'approved',
      revisionRequired: 'revisionRequired',
      rejected: 'rejected',
      information: 'inReview',
    };
    const assistanceRequest = await mongoose.connection.transaction(async (session) => {
      const record = await AssistanceRequest.findOne({ _id: requestId, ...requestScope(request.user) }).session(session);
      if (!record) fail('Request not found in your district', 404);
      assertOfficerOwnsRequest(request.user, record);
      const from = record.status;
      record.assignedOfficer = request.user._id;
      record.status = statusByResponse[type];
      record.responses.push({ message, respondedBy: request.user._id, scheduledVisitAt: visitDate, type });
      record.history.push({ action: 'response', actor: request.user._id, fromStatus: from, toStatus: record.status });
      await record.save({ session }); return record;
    });
    await assistanceRequest.populate([
      { path: 'farmer', select: 'name email' },
      { path: 'assignedOfficer', select: 'name email' },
      { path: 'responses.respondedBy', select: 'name email' },
    ]);

    return response.status(201).json({
      message: 'Official response sent successfully',
      request: assistanceRequest,
    });
  } catch (error) {
    return next(error);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
