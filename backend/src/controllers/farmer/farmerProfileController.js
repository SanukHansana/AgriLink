import FarmerProfile, { FARMER_LANGUAGES } from '../../models/FarmerProfile.js';

const PROFILE_FIELDS = [
  'phone',
  'farmName',
  'farmLocation',
  'farmSizeAcres',
  'mainCrops',
  'preferredLanguage',
];

function profileData(body) {
  return PROFILE_FIELDS.reduce((profile, field) => {
    if (body[field] !== undefined) profile[field] = body[field];
    return profile;
  }, {});
}

function validateProfileInput(data) {
  if (
    data.farmSizeAcres !== undefined &&
    (typeof data.farmSizeAcres !== 'number' || !Number.isFinite(data.farmSizeAcres) || data.farmSizeAcres <= 0)
  ) {
    return 'Farm size must be a positive number';
  }
  if (
    data.mainCrops !== undefined &&
    (!Array.isArray(data.mainCrops) ||
      data.mainCrops.length > 10 ||
      data.mainCrops.some((crop) => typeof crop !== 'string' || !crop.trim()))
  ) {
    return 'Main crops must contain up to 10 crop names';
  }
  if (data.preferredLanguage && !FARMER_LANGUAGES.includes(data.preferredLanguage)) {
    return 'Enter a valid preferred language';
  }
  return null;
}

export async function createFarmerProfile(request, response, next) {
  try {
    const data = profileData(request.body);
    const validationError = validateProfileInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    const existingProfile = await FarmerProfile.exists({ user: request.user._id });
    if (existingProfile) {
      return response.status(409).json({ message: 'Farmer profile already exists' });
    }

    const profile = await FarmerProfile.create({
      ...data,
      mainCrops: data.mainCrops?.map((crop) => crop.trim()),
      user: request.user._id,
    });
    return response.status(201).json({
      message: 'Farmer profile created successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerProfile(request, response, next) {
  try {
    const profile = await FarmerProfile.findOne({ user: request.user._id }).populate(
      'user',
      'name email',
    );
    if (!profile) return response.status(404).json({ message: 'Farmer profile not found' });
    return response.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmerProfile(request, response, next) {
  try {
    const updates = profileData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one farmer profile field' });
    }
    const validationError = validateProfileInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });
    if (updates.mainCrops) updates.mainCrops = updates.mainCrops.map((crop) => crop.trim());

    const profile = await FarmerProfile.findOneAndUpdate(
      { user: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('user', 'name email');
    if (!profile) return response.status(404).json({ message: 'Farmer profile not found' });

    return response.status(200).json({
      message: 'Farmer profile updated successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteFarmerProfile(request, response, next) {
  try {
    const profile = await FarmerProfile.findOneAndDelete({ user: request.user._id });
    if (!profile) return response.status(404).json({ message: 'Farmer profile not found' });
    return response.status(200).json({ message: 'Farmer profile deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
