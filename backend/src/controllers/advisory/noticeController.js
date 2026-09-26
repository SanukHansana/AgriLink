import { officerDistrict, districtPattern } from '../../services/officer-access.js';
import { liveNoticeFilter, validateNoticeSchedule } from '../../services/notice-scheduling.js';
import { fail } from '../../services/bidding.js';
import FarmerProfile from '../../models/FarmerProfile.js';
import Notice, {
  NOTICE_AUDIENCES,
  NOTICE_LANGUAGES,
  NOTICE_STATUSES,
  NOTICE_TYPES,
} from '../../models/Notice.js';
import { isValidMongoId } from '../../utils/validation.js';

const NOTICE_FIELDS = [
  'type',
  'title',
  'description',
  'targetAudience',
  'targetDistrict',
  'languages',
  'isEmergency',
  'scheduledPublishAt',
  'expiresAt',
];

function noticeData(body) {
  return NOTICE_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function validateNoticeInput(data) {
  if (data.type && !NOTICE_TYPES.includes(data.type)) return 'Enter a valid notice type';
  if (data.targetAudience && !NOTICE_AUDIENCES.includes(data.targetAudience)) {
    return 'Enter a valid notice audience';
  }
  if (
    data.languages !== undefined &&
    (!Array.isArray(data.languages) ||
      data.languages.length === 0 ||
      data.languages.some((language) => !NOTICE_LANGUAGES.includes(language)))
  ) {
    return 'Select at least one valid publishing language';
  }
  if (data.isEmergency !== undefined && typeof data.isEmergency !== 'boolean') {
    return 'Emergency alert must be true or false';
  }
  return null;
}

async function noticeAccessFilter(request) {
  if (request.user.role === 'agricultureOfficer') return { officer: request.user._id };

  const profile = await FarmerProfile.findOne({ user: request.user._id }).select(
    'farmLocation.district',
  );
  const audiences = [{ targetAudience: 'allFarmers' }];
  if (profile?.farmLocation?.district) {
    audiences.push({
      targetAudience: 'district',
      targetDistrict: new RegExp(`^${escapeRegex(profile.farmLocation.district)}$`, 'i'),
    });
  }
  return { status: 'published', $and: [{ $or: audiences }, liveNoticeFilter()] };
}

export async function createNotice(request, response, next) {
  try {
    const data = noticeData(request.body);
    officerDistrict(request.user);
    validateNoticeSchedule(data);
    if (data.targetAudience === 'district' && !districtPattern(request.user.officerDistrict).test(data.targetDistrict ?? '')) fail('Target notices to your assigned service district');
    const validationError = validateNoticeInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    const notice = await Notice.create({ ...data, officer: request.user._id });
    await notice.populate('officer', 'name email');
    return response.status(201).json({
      message: 'Notice draft created successfully',
      notice,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getNotices(request, response, next) {
  try {
    const { emergency, status, type } = request.query;
    if (type && !NOTICE_TYPES.includes(type)) {
      return response.status(400).json({ message: 'Enter a valid notice type filter' });
    }
    if (status && !NOTICE_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid notice status filter' });
    }
    if (emergency !== undefined && !['true', 'false'].includes(emergency)) {
      return response.status(400).json({ message: 'Emergency filter must be true or false' });
    }

    const filter = await noticeAccessFilter(request);
    if (type) filter.type = type;
    if (emergency !== undefined) filter.isEmergency = emergency === 'true';
    if (status && request.user.role === 'agricultureOfficer') filter.status = status;

    const notices = await Notice.find(filter)
      .populate('officer', 'name email')
      .sort({ isEmergency: -1, publishedAt: -1, createdAt: -1 });
    return response.status(200).json({ notices });
  } catch (error) {
    return next(error);
  }
}

export async function getNotice(request, response, next) {
  try {
    const { noticeId } = request.params;
    if (!isValidMongoId(noticeId)) {
      return response.status(400).json({ message: 'Enter a valid notice ID' });
    }

    const notice = await Notice.findOne({
      _id: noticeId,
      ...(await noticeAccessFilter(request)),
    }).populate('officer', 'name email');
    if (!notice) return response.status(404).json({ message: 'Notice not found' });
    return response.status(200).json({ notice });
  } catch (error) {
    return next(error);
  }
}

export async function updateNotice(request, response, next) {
  try {
    const { noticeId } = request.params;
    if (!isValidMongoId(noticeId)) {
      return response.status(400).json({ message: 'Enter a valid notice ID' });
    }

    const updates = noticeData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one notice field to update' });
    }
    const validationError = validateNoticeInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });

    const notice = await Notice.findOne({ _id: noticeId, officer: request.user._id });
    if (!notice) return response.status(404).json({ message: 'Notice not found' });
    if (notice.status === 'archived') {
      return response.status(400).json({ message: 'Archived notices cannot be edited' });
    }

    const candidate = { ...notice.toObject(), ...updates };
    // Existing dates can already be due; validate future dates only when changed.
    validateNoticeSchedule(updates);
    if (candidate.expiresAt && candidate.scheduledPublishAt && new Date(candidate.expiresAt) <= new Date(candidate.scheduledPublishAt)) fail('Expiry must be after publishing');
    if (candidate.targetAudience === 'district' && !districtPattern(officerDistrict(request.user)).test(candidate.targetDistrict)) fail('Target notices to your assigned service district');
    if (notice.status === 'published' && updates.scheduledPublishAt) fail('Published notices cannot be scheduled again');
    notice.set(updates);
    if (updates.targetAudience === 'allFarmers') notice.targetDistrict = undefined;
    await notice.save();
    await notice.populate('officer', 'name email');

    return response.status(200).json({ message: 'Notice updated successfully', notice });
  } catch (error) {
    return next(error);
  }
}

export async function deleteNotice(request, response, next) {
  try {
    const { noticeId } = request.params;
    if (!isValidMongoId(noticeId)) {
      return response.status(400).json({ message: 'Enter a valid notice ID' });
    }

    const notice = await Notice.findOneAndDelete({
      _id: noticeId,
      officer: request.user._id,
      status: 'draft',
    });
    if (!notice) return response.status(404).json({ message: 'Notice draft not found' });
    return response.status(200).json({ message: 'Notice draft deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function publishNotice(request, response, next) {
  try {
    const { noticeId } = request.params;
    if (!isValidMongoId(noticeId)) {
      return response.status(400).json({ message: 'Enter a valid notice ID' });
    }

    const notice = await Notice.findOne({ _id: noticeId, officer: request.user._id, status: 'draft' });
    if (!notice) fail('Notice draft not found', 404);
    officerDistrict(request.user);
    if (notice.targetAudience === 'district' && !districtPattern(request.user.officerDistrict).test(notice.targetDistrict)) fail('Target notices to your assigned service district');
    if (notice.expiresAt && notice.expiresAt <= new Date()) fail('This notice has already expired');
    const scheduled = notice.scheduledPublishAt && notice.scheduledPublishAt > new Date();
    const published = await Notice.findOneAndUpdate({ _id: noticeId, officer: request.user._id, status: 'draft', updatedAt: notice.updatedAt }, { $set: { status: scheduled ? 'scheduled' : 'published', publishedAt: scheduled ? null : new Date(), notificationPending: !scheduled } }, { new: true, runValidators: true }).populate('officer', 'name email');
    if (!published) fail('Notice changed. Refresh and try again.', 409);

    return response.status(200).json({ message: scheduled ? 'Notice scheduled successfully' : 'Notice published successfully', notice: published });
  } catch (error) {
    return next(error);
  }
}

export async function archiveNotice(request, response, next) {
  try {
    const { noticeId } = request.params;
    if (!isValidMongoId(noticeId)) {
      return response.status(400).json({ message: 'Enter a valid notice ID' });
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: noticeId, officer: request.user._id, status: { $in: ['published', 'scheduled'] } },
      { $set: { status: 'archived', notificationPending: false } },
      { new: true, runValidators: true },
    ).populate('officer', 'name email');
    if (!notice) return response.status(404).json({ message: 'Published notice not found' });

    return response.status(200).json({ message: 'Notice archived successfully', notice });
  } catch (error) {
    return next(error);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
