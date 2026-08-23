import SurplusAdvisory, {
  SURPLUS_ADVISORY_STATUSES,
  SURPLUS_LEVELS,
} from '../../models/SurplusAdvisory.js';
import { isValidMongoId } from '../../utils/validation.js';

const ADVISORY_FIELDS = [
  'cropName',
  'harvestSeason',
  'affectedDistricts',
  'surplusVolumeMt',
  'level',
  'priceImpactPercent',
  'recommendedActions',
];

function advisoryData(body) {
  return ADVISORY_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function validateAdvisoryInput(data) {
  if (data.level && !SURPLUS_LEVELS.includes(data.level)) return 'Enter a valid surplus level';
  if (data.affectedDistricts !== undefined && !Array.isArray(data.affectedDistricts)) {
    return 'Affected districts must be provided as a list';
  }
  if (data.recommendedActions !== undefined && !Array.isArray(data.recommendedActions)) {
    return 'Recommended actions must be provided as a list';
  }
  for (const field of ['surplusVolumeMt', 'priceImpactPercent']) {
    if (data[field] !== undefined && (typeof data[field] !== 'number' || !Number.isFinite(data[field]))) {
      return `${field === 'surplusVolumeMt' ? 'Surplus volume' : 'Price impact'} must be a number`;
    }
  }
  return null;
}

export async function createSurplusAdvisory(request, response, next) {
  try {
    const data = advisoryData(request.body);
    const validationError = validateAdvisoryInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    const advisory = await SurplusAdvisory.create({ ...data, officer: request.user._id });
    await advisory.populate('officer', 'name email');
    return response.status(201).json({ message: 'Market surplus advisory issued successfully', advisory });
  } catch (error) {
    return next(error);
  }
}

export async function getSurplusAdvisories(request, response, next) {
  try {
    const { district, level, status } = request.query;
    if (level && !SURPLUS_LEVELS.includes(level)) {
      return response.status(400).json({ message: 'Enter a valid surplus level filter' });
    }
    if (status && !SURPLUS_ADVISORY_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid advisory status filter' });
    }
    const filter = {};
    if (request.user.role === 'farmer') filter.status = 'active';
    else if (status) filter.status = status;
    if (district) filter.affectedDistricts = new RegExp(`^${escapeRegex(district)}$`, 'i');
    if (level) filter.level = level;

    const advisories = await SurplusAdvisory.find(filter)
      .populate('officer', 'name email')
      .sort({ status: 1, level: 1, issuedAt: -1 });
    return response.status(200).json({ advisories });
  } catch (error) {
    return next(error);
  }
}

export async function updateSurplusAdvisory(request, response, next) {
  try {
    const { advisoryId } = request.params;
    if (!isValidMongoId(advisoryId)) {
      return response.status(400).json({ message: 'Enter a valid surplus advisory ID' });
    }
    const updates = advisoryData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one surplus advisory field' });
    }
    const validationError = validateAdvisoryInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });

    const advisory = await SurplusAdvisory.findOneAndUpdate(
      { _id: advisoryId, officer: request.user._id, status: 'active' },
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('officer', 'name email');
    if (!advisory) return response.status(404).json({ message: 'Active surplus advisory not found' });
    return response.status(200).json({ message: 'Market surplus advisory updated successfully', advisory });
  } catch (error) {
    return next(error);
  }
}

export async function resolveSurplusAdvisory(request, response, next) {
  try {
    const { advisoryId } = request.params;
    if (!isValidMongoId(advisoryId)) {
      return response.status(400).json({ message: 'Enter a valid surplus advisory ID' });
    }
    const advisory = await SurplusAdvisory.findOneAndUpdate(
      { _id: advisoryId, officer: request.user._id, status: 'active' },
      { $set: { status: 'resolved' } },
      { new: true, runValidators: true },
    ).populate('officer', 'name email');
    if (!advisory) return response.status(404).json({ message: 'Active surplus advisory not found' });
    return response.status(200).json({ message: 'Market surplus advisory resolved successfully', advisory });
  } catch (error) {
    return next(error);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
