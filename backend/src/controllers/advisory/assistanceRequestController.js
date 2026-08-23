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

function populateRequest(query) {
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
  if (data.attachments !== undefined && !Array.isArray(data.attachments)) {
    return 'Attachments must be provided as a list';
  }
  return null;
}

function requestAccessFilter(request) {
  return request.user.role === 'farmer' ? { farmer: request.user._id } : {};
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

    const filter = requestAccessFilter(request);
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (district) filter['farmLocation.district'] = new RegExp(`^${escapeRegex(district)}$`, 'i');

    const requests = await populateRequest(AssistanceRequest.find(filter)).sort({
      priority: -1,
      createdAt: -1,
    });
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
        ...requestAccessFilter(request),
      }),
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

    const updates = { assignedOfficer: request.user._id };
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes;

    const assistanceRequest = await AssistanceRequest.findByIdAndUpdate(
      requestId,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate('farmer', 'name email')
      .populate('assignedOfficer', 'name email');
    if (!assistanceRequest) {
      return response.status(404).json({ message: 'Assistance request not found' });
    }

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
    if (scheduledVisitAt && !visitDate) {
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
    const assistanceRequest = await AssistanceRequest.findById(requestId);
    if (!assistanceRequest) {
      return response.status(404).json({ message: 'Assistance request not found' });
    }

    assistanceRequest.assignedOfficer = request.user._id;
    assistanceRequest.status = statusByResponse[type];
    assistanceRequest.responses.push({
      message,
      respondedBy: request.user._id,
      scheduledVisitAt: visitDate,
      type,
    });
    await assistanceRequest.save();
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
