import QualityGuideline, { QUALITY_GUIDELINE_STATUSES } from '../../models/QualityGuideline.js';
import { isValidMongoId, parseValidDate } from '../../utils/validation.js';

const GUIDELINE_FIELDS = [
  'cropName',
  'growingRegion',
  'maxMoisture',
  'minPurity',
  'sizingGrade',
  'requiredCertification',
  'effectiveDate',
];

function guidelineData(body) {
  return GUIDELINE_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function validateGuidelineInput(data) {
  if (data.effectiveDate !== undefined) {
    const date = parseValidDate(data.effectiveDate);
    if (!date) return 'Enter a valid guideline effective date';
    data.effectiveDate = date;
  }
  return null;
}

export async function createQualityGuideline(request, response, next) {
  try {
    const data = guidelineData(request.body);
    const validationError = validateGuidelineInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    const guideline = await QualityGuideline.create({ ...data, officer: request.user._id });
    await guideline.populate('officer', 'name email');
    return response.status(201).json({ message: 'Quality guideline created successfully', guideline });
  } catch (error) {
    return next(error);
  }
}

export async function getQualityGuidelines(request, response, next) {
  try {
    const { crop, status } = request.query;
    if (status && !QUALITY_GUIDELINE_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid guideline status filter' });
    }
    const filter = {};
    if (request.user.role === 'farmer') filter.status = 'active';
    else if (status) filter.status = status;
    if (crop) filter.cropName = new RegExp(escapeRegex(crop), 'i');

    const guidelines = await QualityGuideline.find(filter)
      .populate('officer', 'name email')
      .sort({ status: 1, cropName: 1 });
    return response.status(200).json({ guidelines });
  } catch (error) {
    return next(error);
  }
}

export async function updateQualityGuideline(request, response, next) {
  try {
    const { guidelineId } = request.params;
    if (!isValidMongoId(guidelineId)) {
      return response.status(400).json({ message: 'Enter a valid quality guideline ID' });
    }
    const updates = guidelineData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one guideline field' });
    }
    const validationError = validateGuidelineInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });

    const guideline = await QualityGuideline.findOneAndUpdate(
      { _id: guidelineId, officer: request.user._id, status: 'active' },
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('officer', 'name email');
    if (!guideline) return response.status(404).json({ message: 'Active quality guideline not found' });
    return response.status(200).json({ message: 'Quality guideline updated successfully', guideline });
  } catch (error) {
    return next(error);
  }
}

export async function archiveQualityGuideline(request, response, next) {
  try {
    const { guidelineId } = request.params;
    if (!isValidMongoId(guidelineId)) {
      return response.status(400).json({ message: 'Enter a valid quality guideline ID' });
    }
    const guideline = await QualityGuideline.findOneAndUpdate(
      { _id: guidelineId, officer: request.user._id, status: 'active' },
      { $set: { status: 'archived' } },
      { new: true, runValidators: true },
    ).populate('officer', 'name email');
    if (!guideline) return response.status(404).json({ message: 'Active quality guideline not found' });
    return response.status(200).json({ message: 'Quality guideline archived successfully', guideline });
  } catch (error) {
    return next(error);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
