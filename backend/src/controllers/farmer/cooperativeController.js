import Cooperative from '../../models/Cooperative.js';
import Product, { PRODUCT_CATEGORIES } from '../../models/Product.js';
import { PRODUCT_UNITS } from '../../models/Bid.js';
import { isPositiveNumber, isValidMongoId, parseValidDate } from '../../utils/validation.js';

function populateCooperative(query) {
  return query.populate('createdBy', 'name').populate('members.farmer', 'name');
}

function isMember(cooperative, farmerId) {
  return cooperative.members.some((member) => String(member.farmer._id ?? member.farmer) === String(farmerId));
}

export async function createCooperative(request, response, next) {
  try {
    const { description, district, name } = request.body;
    if (!name?.trim() || !district?.trim()) {
      return response.status(400).json({ message: 'Cooperative name and district are required' });
    }
    const cooperative = await Cooperative.create({
      createdBy: request.user._id,
      description,
      district: district.trim(),
      members: [{ farmer: request.user._id, role: 'owner' }],
      name: name.trim(),
    });
    await cooperative.populate('createdBy', 'name');
    await cooperative.populate('members.farmer', 'name');
    return response.status(201).json({ message: 'Cooperative created successfully', cooperative });
  } catch (error) {
    return next(error);
  }
}

export async function getCooperatives(request, response, next) {
  try {
    const { mine } = request.query;
    const filter = { status: 'active' };
    if (mine === 'true') filter['members.farmer'] = request.user._id;
    const cooperatives = await populateCooperative(Cooperative.find(filter).sort({ createdAt: -1 }));
    return response.status(200).json({ count: cooperatives.length, cooperatives });
  } catch (error) {
    return next(error);
  }
}

export async function getCooperative(request, response, next) {
  try {
    if (!isValidMongoId(request.params.cooperativeId)) {
      return response.status(400).json({ message: 'Enter a valid cooperative ID' });
    }
    const cooperative = await populateCooperative(Cooperative.findById(request.params.cooperativeId));
    if (!cooperative) return response.status(404).json({ message: 'Cooperative not found' });
    return response.status(200).json({ cooperative });
  } catch (error) {
    return next(error);
  }
}

export async function joinCooperative(request, response, next) {
  try {
    const { cooperativeId } = request.params;
    if (!isValidMongoId(cooperativeId)) return response.status(400).json({ message: 'Enter a valid cooperative ID' });
    const cooperative = await Cooperative.findOne({ _id: cooperativeId, status: 'active' });
    if (!cooperative) return response.status(404).json({ message: 'Cooperative not found' });
    if (!isMember(cooperative, request.user._id)) {
      cooperative.members.push({ farmer: request.user._id, role: 'member' });
      await cooperative.save();
    }
    await cooperative.populate('createdBy', 'name');
    await cooperative.populate('members.farmer', 'name');
    return response.status(200).json({ message: 'Cooperative joined successfully', cooperative });
  } catch (error) {
    return next(error);
  }
}

export async function leaveCooperative(request, response, next) {
  try {
    const { cooperativeId } = request.params;
    if (!isValidMongoId(cooperativeId)) return response.status(400).json({ message: 'Enter a valid cooperative ID' });
    const cooperative = await Cooperative.findById(cooperativeId);
    if (!cooperative) return response.status(404).json({ message: 'Cooperative not found' });
    const membership = cooperative.members.find((member) => String(member.farmer) === String(request.user._id));
    if (membership?.role === 'owner') return response.status(409).json({ message: 'The cooperative owner cannot leave' });
    cooperative.members = cooperative.members.filter((member) => String(member.farmer) !== String(request.user._id));
    for (const pool of cooperative.productPools) {
      pool.contributions = pool.contributions.filter((item) => String(item.farmer) !== String(request.user._id));
    }
    await cooperative.save();
    return response.status(200).json({ message: 'Cooperative left successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function addCooperativeContribution(request, response, next) {
  try {
    const { cooperativeId } = request.params;
    const { category, name, qualityGrade, quantity, unit } = request.body;
    if (!isValidMongoId(cooperativeId)) return response.status(400).json({ message: 'Enter a valid cooperative ID' });
    if (!name?.trim() || !PRODUCT_CATEGORIES.includes(category) || !PRODUCT_UNITS.includes(unit) || !isPositiveNumber(quantity)) {
      return response.status(400).json({ message: 'Product name, category, unit, and positive quantity are required' });
    }
    const cooperative = await Cooperative.findById(cooperativeId);
    if (!cooperative || !isMember(cooperative, request.user._id)) {
      return response.status(403).json({ message: 'Join this cooperative before contributing products' });
    }
    let pool = cooperative.productPools.find((item) => item.name.toLowerCase() === name.trim().toLowerCase() && item.unit === unit);
    if (!pool) {
      cooperative.productPools.push({ name: name.trim(), category, unit, contributions: [] });
      pool = cooperative.productPools.at(-1);
    }
    const contribution = pool.contributions.find((item) => String(item.farmer) === String(request.user._id));
    if (contribution) { contribution.quantity = quantity; contribution.qualityGrade = qualityGrade; }
    else pool.contributions.push({ farmer: request.user._id, quantity, qualityGrade });
    await cooperative.save();
    await cooperative.populate('members.farmer', 'name');
    return response.status(200).json({ message: 'Cooperative contribution saved', cooperative });
  } catch (error) {
    return next(error);
  }
}

export async function publishCooperativeProduct(request, response, next) {
  try {
    const { cooperativeId, poolId } = request.params;
    if (!isValidMongoId(cooperativeId) || !isValidMongoId(poolId)) {
      return response.status(400).json({ message: 'Enter valid cooperative and pool IDs' });
    }
    const cooperative = await Cooperative.findById(cooperativeId);
    if (!cooperative || !isMember(cooperative, request.user._id)) {
      return response.status(403).json({ message: 'Cooperative membership is required' });
    }
    const pool = cooperative.productPools.id(poolId);
    if (!pool || pool.totalQuantity <= 0) return response.status(404).json({ message: 'Combined product pool not found' });
    const { biddingClosesAt, farmLocation, fixedPrice, minimumBidPrice, minimumOrderQuantity = 1, pricingMode } = request.body;
    if (!farmLocation?.district || !['fixedPrice', 'bidding', 'both'].includes(pricingMode)) {
      return response.status(400).json({ message: 'Farm district and pricing mode are required' });
    }
    const product = await Product.create({
      availableQuantity: pool.totalQuantity,
      biddingClosesAt: biddingClosesAt ? parseValidDate(biddingClosesAt) : undefined,
      category: pool.category,
      cooperative: cooperative._id,
      description: request.body.description,
      farmLocation,
      farmer: request.user._id,
      fixedPrice,
      images: request.body.images ?? [],
      listingType: 'current',
      minimumBidPrice,
      minimumOrderQuantity,
      name: pool.name,
      pricingMode,
      unit: pool.unit,
    });
    return response.status(201).json({ message: 'Combined cooperative product listed', product });
  } catch (error) {
    return next(error);
  }
}
