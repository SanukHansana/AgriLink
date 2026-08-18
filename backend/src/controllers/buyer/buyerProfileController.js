import BuyerProfile from '../../models/BuyerProfile.js';

const PROFILE_FIELDS = [
  'buyerType',
  'businessName',
  'businessRegistrationNumber',
  'phone',
  'deliveryLocations',
];

function profileData(body) {
  return PROFILE_FIELDS.reduce((profile, field) => {
    if (body[field] !== undefined) {
      profile[field] = body[field];
    }

    return profile;
  }, {});
}

export async function createBuyerProfile(request, response, next) {
  try {
    const existingProfile = await BuyerProfile.findOne({ user: request.user._id });

    if (existingProfile) {
      return response.status(409).json({
        message: 'A buyer profile already exists for this account',
      });
    }

    const profile = await BuyerProfile.create({
      ...profileData(request.body),
      user: request.user._id,
    });

    return response.status(201).json({
      message: 'Buyer profile created successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBuyerProfile(request, response, next) {
  try {
    const profile = await BuyerProfile.findOne({ user: request.user._id });

    if (!profile) {
      return response.status(404).json({ message: 'Buyer profile not found' });
    }

    return response.status(200).json({ profile });
  } catch (error) {
    return next(error);
  }
}

export async function updateBuyerProfile(request, response, next) {
  try {
    const updates = profileData(request.body);

    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one profile field to update' });
    }

    const profile = await BuyerProfile.findOneAndUpdate(
      { user: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!profile) {
      return response.status(404).json({ message: 'Buyer profile not found' });
    }

    return response.status(200).json({
      message: 'Buyer profile updated successfully',
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBuyerProfile(request, response, next) {
  try {
    const profile = await BuyerProfile.findOneAndDelete({ user: request.user._id });

    if (!profile) {
      return response.status(404).json({ message: 'Buyer profile not found' });
    }

    return response.status(200).json({ message: 'Buyer profile deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
