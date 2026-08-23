import OfficerProfile, { OFFICER_SPECIALIZATIONS } from '../../models/OfficerProfile.js';

const PROFILE_FIELDS = ['employeeId', 'phone', 'assignedCenter', 'specialization', 'division'];

function profileData(body) {
  return PROFILE_FIELDS.reduce((profile, field) => {
    if (body[field] !== undefined) profile[field] = body[field];
    return profile;
  }, {});
}

function validateProfileInput(data) {
  if (data.specialization && !OFFICER_SPECIALIZATIONS.includes(data.specialization)) {
    return 'Enter a valid officer specialization';
  }
  return null;
}

export async function createOfficerProfile(request, response, next) {
  try {
    const data = profileData(request.body);
    const validationError = validateProfileInput(data);
    if (validationError) return response.status(400).json({ message: validationError });

    if (await OfficerProfile.exists({ user: request.user._id })) {
      return response.status(409).json({ message: 'Agriculture officer profile already exists' });
    }

    const profile = await OfficerProfile.create({ ...data, user: request.user._id });
    await profile.populate('user', 'name email');

    return response.status(201).json({
      message: 'Agriculture officer profile created successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getOfficerProfile(request, response, next) {
  try {
    const profile = await OfficerProfile.findOne({ user: request.user._id }).populate(
      'user',
      'name email',
    );
    if (!profile) {
      return response.status(404).json({ message: 'Agriculture officer profile not found' });
    }
    return response.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
}

export async function updateOfficerProfile(request, response, next) {
  try {
    const updates = profileData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one officer profile field' });
    }

    const validationError = validateProfileInput(updates);
    if (validationError) return response.status(400).json({ message: validationError });

    const profile = await OfficerProfile.findOneAndUpdate(
      { user: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    ).populate('user', 'name email');
    if (!profile) {
      return response.status(404).json({ message: 'Agriculture officer profile not found' });
    }

    return response.status(200).json({
      message: 'Agriculture officer profile updated successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOfficerProfile(request, response, next) {
  try {
    const profile = await OfficerProfile.findOneAndDelete({ user: request.user._id });
    if (!profile) {
      return response.status(404).json({ message: 'Agriculture officer profile not found' });
    }
    return response.status(200).json({ message: 'Agriculture officer profile deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
