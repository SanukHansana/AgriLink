import { PRODUCT_UNITS } from '../../models/Bid.js';
import { PRODUCT_CATEGORIES } from '../../models/Product.js';
import PurchaseRequest, {
  PURCHASE_REQUEST_STATUSES,
} from '../../models/PurchaseRequest.js';
import { isPositiveNumber, isValidMongoId, parseValidDate } from '../../utils/validation.js';

const FIELDS = [
  'productName',
  'category',
  'quantity',
  'unit',
  'maximumUnitPrice',
  'requiredBy',
  'deliveryLocation',
  'qualityRequirements',
  'status',
];

function requestData(body) {
  return FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

function validate(data) {
  if (typeof data.productName !== 'string' || data.productName.trim().length < 2) {
    return 'Product name must contain at least 2 characters';
  }
  if (!PRODUCT_CATEGORIES.includes(data.category)) return 'Enter a valid product category';
  if (!isPositiveNumber(data.quantity)) return 'Quantity must be a positive number';
  if (!PRODUCT_UNITS.includes(data.unit)) return 'Enter a valid product unit';
  if (!isPositiveNumber(data.maximumUnitPrice)) {
    return 'Maximum unit price must be a positive number';
  }
  const requiredBy = parseValidDate(data.requiredBy);
  if (!requiredBy) return 'Enter a valid required date';
  if (requiredBy < new Date(new Date().setHours(0, 0, 0, 0))) {
    return 'Required date cannot be in the past';
  }
  if (!data.deliveryLocation || typeof data.deliveryLocation !== 'object' ||
      typeof data.deliveryLocation.district !== 'string' || !data.deliveryLocation.district.trim()) {
    return 'Delivery district is required';
  }
  if (data.status && !PURCHASE_REQUEST_STATUSES.includes(data.status)) {
    return 'Enter a valid purchase request status';
  }
  return null;
}

export async function createPurchaseRequest(request, response, next) {
  try {
    const data = requestData(request.body);
    const validationError = validate(data);
    if (validationError) return response.status(400).json({ message: validationError });
    data.requiredBy = parseValidDate(data.requiredBy);
    const purchaseRequest = await PurchaseRequest.create({ ...data, buyer: request.user._id });
    return response.status(201).json({ message: 'Wanted product listed successfully', purchaseRequest });
  } catch (error) {
    return next(error);
  }
}

export async function getPurchaseRequests(request, response, next) {
  try {
    const { status } = request.query;
    if (status && !PURCHASE_REQUEST_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid purchase request status' });
    }
    const filter = { buyer: request.user._id };
    if (status) filter.status = status;
    const purchaseRequests = await PurchaseRequest.find(filter).sort({ createdAt: -1 });
    return response.status(200).json({ count: purchaseRequests.length, purchaseRequests });
  } catch (error) {
    return next(error);
  }
}

export async function getPurchaseRequest(request, response, next) {
  try {
    if (!isValidMongoId(request.params.requestId)) {
      return response.status(400).json({ message: 'Enter a valid purchase request ID' });
    }
    const purchaseRequest = await PurchaseRequest.findOne({
      _id: request.params.requestId,
      buyer: request.user._id,
    });
    if (!purchaseRequest) return response.status(404).json({ message: 'Wanted product not found' });
    return response.status(200).json({ purchaseRequest });
  } catch (error) {
    return next(error);
  }
}

export async function updatePurchaseRequest(request, response, next) {
  try {
    if (!isValidMongoId(request.params.requestId)) {
      return response.status(400).json({ message: 'Enter a valid purchase request ID' });
    }
    const existing = await PurchaseRequest.findOne({
      _id: request.params.requestId,
      buyer: request.user._id,
    });
    if (!existing) return response.status(404).json({ message: 'Wanted product not found' });
    const updates = requestData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one purchase request field' });
    }
    const candidate = { ...existing.toObject(), ...updates };
    const validationError = validate(candidate);
    if (validationError) return response.status(400).json({ message: validationError });
    if (updates.requiredBy !== undefined) updates.requiredBy = parseValidDate(updates.requiredBy);
    const purchaseRequest = await PurchaseRequest.findOneAndUpdate(
      { _id: request.params.requestId, buyer: request.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );
    return response.status(200).json({ message: 'Wanted product updated successfully', purchaseRequest });
  } catch (error) {
    return next(error);
  }
}

export async function deletePurchaseRequest(request, response, next) {
  try {
    if (!isValidMongoId(request.params.requestId)) {
      return response.status(400).json({ message: 'Enter a valid purchase request ID' });
    }
    const purchaseRequest = await PurchaseRequest.findOneAndDelete({
      _id: request.params.requestId,
      buyer: request.user._id,
    });
    if (!purchaseRequest) return response.status(404).json({ message: 'Wanted product not found' });
    return response.status(200).json({ message: 'Wanted product deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
