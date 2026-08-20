import DriverProfile from '../../models/DriverProfile.js';

const PROFILE_FIELDS = [
  'phone',
  'licenseNumber',
  'licenseExpiryDate',
  'baseLocation',
  'availabilityStatus',
];

function profileData(body) {
  return PROFILE_FIELDS.reduce((profile, field) => {
    if (body[field] !== undefined) {
      profile[field] = body[field];
    }
    return profile;
  }, {});
}

export async function createDriverProfile(request, response, next) {
  try {
    const existingProfile = await DriverProfile.findOne({ user: request.user._id });
    if (existingProfile) {
      return response.status(409).json({ message: 'A driver profile already exists' });
    }

    const profile = await DriverProfile.create({
      ...profileData(request.body),
      user: request.user._id,
    });

    return response.status(201).json({
      message: 'Driver profile created successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDriverProfile(request, response, next) {
  try {
    const profile = await DriverProfile.findOne({ user: request.user._id });
    if (!profile) {
      return response.status(404).json({ message: 'Driver profile not found' });
    }

    return response.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
}

export async function updateDriverProfile(request, response, next) {
  try {
    const updates = profileData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one profile field to update' });
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { user: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!profile) {
      return response.status(404).json({ message: 'Driver profile not found' });
    }

    return response.status(200).json({
      message: 'Driver profile updated successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteDriverProfile(request, response, next) {
  try {
    const profile = await DriverProfile.findOneAndDelete({ user: request.user._id });
    if (!profile) {
      return response.status(404).json({ message: 'Driver profile not found' });
    }

    return response.status(200).json({ message: 'Driver profile deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
