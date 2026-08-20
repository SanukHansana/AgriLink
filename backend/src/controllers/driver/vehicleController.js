import DeliveryJob from '../../models/DeliveryJob.js';
import Vehicle from '../../models/Vehicle.js';
import { isValidMongoId } from '../../utils/validation.js';

const VEHICLE_FIELDS = [
  'vehicleType',
  'registrationNumber',
  'make',
  'model',
  'capacityKg',
  'isRefrigerated',
  'isActive',
];

function vehicleData(body) {
  return VEHICLE_FIELDS.reduce((vehicle, field) => {
    if (body[field] !== undefined) {
      vehicle[field] = body[field];
    }
    return vehicle;
  }, {});
}

export async function createVehicle(request, response, next) {
  try {
    const vehicle = await Vehicle.create({
      ...vehicleData(request.body),
      driver: request.user._id,
    });

    return response.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDriverVehicles(request, response, next) {
  try {
    const vehicles = await Vehicle.find({ driver: request.user._id }).sort({ createdAt: -1 });
    return response.status(200).json({ count: vehicles.length, vehicles });
  } catch (error) {
    return next(error);
  }
}

export async function getDriverVehicle(request, response, next) {
  try {
    const { vehicleId } = request.params;
    if (!isValidMongoId(vehicleId)) {
      return response.status(400).json({ message: 'Enter a valid vehicle ID' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driver: request.user._id });
    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    return response.status(200).json({ vehicle });
  } catch (error) {
    return next(error);
  }
}

export async function updateDriverVehicle(request, response, next) {
  try {
    const { vehicleId } = request.params;
    if (!isValidMongoId(vehicleId)) {
      return response.status(400).json({ message: 'Enter a valid vehicle ID' });
    }

    const updates = vehicleData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one vehicle field to update' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, driver: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    return response.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteDriverVehicle(request, response, next) {
  try {
    const { vehicleId } = request.params;
    if (!isValidMongoId(vehicleId)) {
      return response.status(400).json({ message: 'Enter a valid vehicle ID' });
    }

    const activeJob = await DeliveryJob.exists({
      vehicle: vehicleId,
      assignedDriver: request.user._id,
      status: { $in: ['accepted', 'collecting', 'inTransit'] },
    });
    if (activeJob) {
      return response.status(409).json({
        message: 'This vehicle cannot be deleted while it has an active delivery',
      });
    }

    const vehicle = await Vehicle.findOneAndDelete({
      _id: vehicleId,
      driver: request.user._id,
    });
    if (!vehicle) {
      return response.status(404).json({ message: 'Vehicle not found' });
    }

    return response.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
