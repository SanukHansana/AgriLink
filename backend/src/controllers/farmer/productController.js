import FarmerProfile from '../../models/FarmerProfile.js';
import Product, {
  LISTING_TYPES,
  PRICING_MODES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
} from '../../models/Product.js';
import { PRODUCT_UNITS } from '../../models/Bid.js';
import { isValidMongoId, parseValidDate } from '../../utils/validation.js';

const PRODUCT_FIELDS = [
  'name',
  'category',
  'description',
  'images',
  'listingType',
  'availableQuantity',
  'unit',
  'minimumOrderQuantity',
  'qualityGrade',
  'farmLocation',
  'harvestDate',
  'pricingMode',
  'fixedPrice',
  'minimumBidPrice',
  'biddingClosesAt',
  'status',
];

function productData(body) {
  return PRODUCT_FIELDS.reduce((product, field) => {
    if (body[field] !== undefined) product[field] = body[field];
    return product;
  }, {});
}

function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateProductInput(data) {
  if (!data.name || typeof data.name !== 'string') return 'Product name is required';
  if (!PRODUCT_CATEGORIES.includes(data.category)) return 'Enter a valid product category';
  if (!LISTING_TYPES.includes(data.listingType)) return 'Enter a valid listing type';
  if (!PRODUCT_UNITS.includes(data.unit)) return 'Enter a valid product unit';
  if (!PRICING_MODES.includes(data.pricingMode)) return 'Enter a valid pricing mode';
  if (data.status && !PRODUCT_STATUSES.includes(data.status)) return 'Enter a valid product status';
  if (!isNonNegativeNumber(data.availableQuantity)) {
    return 'Available quantity must be a non-negative number';
  }
  if (!isPositiveNumber(data.minimumOrderQuantity)) {
    return 'Minimum order quantity must be a positive number';
  }
  if (
    !data.farmLocation ||
    typeof data.farmLocation !== 'object' ||
    !data.farmLocation.district
  ) {
    return 'Farm district is required';
  }
  if (
    data.images !== undefined &&
    (!Array.isArray(data.images) ||
      data.images.length > 5 ||
      data.images.some((image) => typeof image !== 'string' || !image.trim()) ||
      data.images.reduce((length, image) => length + image.length, 0) > 900000)
  ) {
    return 'Provide up to 5 product images under 650 KB total';
  }
  if (data.listingType === 'future' && !parseValidDate(data.harvestDate)) {
    return 'A valid harvest date is required for future products';
  }
  if (
    ['fixedPrice', 'both'].includes(data.pricingMode) &&
    !isPositiveNumber(data.fixedPrice)
  ) {
    return 'A positive fixed price is required for fixed-price products';
  }
  if (
    ['bidding', 'both'].includes(data.pricingMode) &&
    !isPositiveNumber(data.minimumBidPrice)
  ) {
    return 'A positive minimum bid price is required for bidding products';
  }
  if (
    ['bidding', 'both'].includes(data.pricingMode) &&
    !parseValidDate(data.biddingClosesAt)
  ) {
    return 'A valid bidding closing date is required for bidding products';
  }
  return null;
}

function normalizeDates(data) {
  for (const field of ['harvestDate', 'biddingClosesAt']) {
    if (data[field] !== undefined) {
      const parsedDate = parseValidDate(data[field]);
      if (!parsedDate) return { error: `Enter a valid ${field}` };
      data[field] = parsedDate;
    }
  }
  return { data };
}

function fieldsToUnset(data) {
  const unset = {};
  if (data.listingType === 'current') unset.harvestDate = '';
  if (data.pricingMode === 'fixedPrice') {
    unset.minimumBidPrice = '';
    unset.biddingClosesAt = '';
  }
  if (data.pricingMode === 'bidding') unset.fixedPrice = '';
  return unset;
}

export async function createFarmerProduct(request, response, next) {
  try {
    const profileExists = await FarmerProfile.exists({ user: request.user._id });
    if (!profileExists) {
      return response.status(409).json({ message: 'Create your farmer profile before listing products' });
    }

    const data = productData(request.body);
    if (data.minimumOrderQuantity === undefined) data.minimumOrderQuantity = 1;
    const validationError = validateProductInput(data);
    if (validationError) return response.status(400).json({ message: validationError });
    const normalized = normalizeDates(data);
    if (normalized.error) return response.status(400).json({ message: normalized.error });

    const product = await Product.create({
      ...normalized.data,
      farmer: request.user._id,
    });
    return response.status(201).json({
      message: 'Product listed successfully',
      product,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerProducts(request, response, next) {
  try {
    const { listingType, status } = request.query;
    if (listingType && !LISTING_TYPES.includes(listingType)) {
      return response.status(400).json({ message: 'Enter a valid listing type' });
    }
    if (status && !PRODUCT_STATUSES.includes(status)) {
      return response.status(400).json({ message: 'Enter a valid product status' });
    }

    const filter = { farmer: request.user._id };
    if (listingType) filter.listingType = listingType;
    if (status) filter.status = status;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return response.status(200).json({ count: products.length, products });
  } catch (error) {
    return next(error);
  }
}

export async function getFarmerProduct(request, response, next) {
  try {
    const { productId } = request.params;
    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }
    const product = await Product.findOne({ _id: productId, farmer: request.user._id });
    if (!product) return response.status(404).json({ message: 'Product not found' });
    return response.status(200).json({ product });
  } catch (error) {
    return next(error);
  }
}

export async function updateFarmerProduct(request, response, next) {
  try {
    const { productId } = request.params;
    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }
    const existingProduct = await Product.findOne({
      _id: productId,
      farmer: request.user._id,
    });
    if (!existingProduct) return response.status(404).json({ message: 'Product not found' });

    const updates = productData(request.body);
    if (Object.keys(updates).length === 0) {
      return response.status(400).json({ message: 'Provide at least one product field' });
    }
    const normalized = normalizeDates(updates);
    if (normalized.error) return response.status(400).json({ message: normalized.error });

    const unset = fieldsToUnset({ ...existingProduct.toObject(), ...normalized.data });
    const candidate = { ...existingProduct.toObject(), ...normalized.data };
    for (const field of Object.keys(unset)) delete candidate[field];
    const validationError = validateProductInput(candidate);
    if (validationError) return response.status(400).json({ message: validationError });

    const updateOperation = { $set: normalized.data };
    if (Object.keys(unset).length > 0) updateOperation.$unset = unset;
    const product = await Product.findOneAndUpdate(
      { _id: productId, farmer: request.user._id },
      updateOperation,
      { new: true, runValidators: true },
    );
    return response.status(200).json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deactivateFarmerProduct(request, response, next) {
  try {
    const { productId } = request.params;
    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }
    const product = await Product.findOneAndUpdate(
      { _id: productId, farmer: request.user._id },
      { $set: { status: 'inactive' } },
      { new: true, runValidators: true },
    );
    if (!product) return response.status(404).json({ message: 'Product not found' });
    return response.status(200).json({
      message: 'Product deactivated successfully',
      product,
    });
  } catch (error) {
    return next(error);
  }
}
