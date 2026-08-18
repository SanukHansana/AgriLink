import Product, {
  LISTING_TYPES,
  PRICING_MODES,
  PRODUCT_CATEGORIES,
} from '../../models/Product.js';
import { isValidMongoId } from '../../utils/validation.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  priceAsc: { fixedPrice: 1, createdAt: -1 },
  priceDesc: { fixedPrice: -1, createdAt: -1 },
};

function exactText(value) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function searchText(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function parsePrice(value, label) {
  if (value === undefined) {
    return { value: undefined };
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return { error: `${label} must be a valid non-negative number` };
  }

  return { value: number };
}

export async function searchMarketplaceProducts(request, response, next) {
  try {
    const {
      q,
      category,
      listingType,
      pricingMode,
      district,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = request.query;

    if (category && !PRODUCT_CATEGORIES.includes(category)) {
      return response.status(400).json({ message: 'Enter a valid product category' });
    }

    if (listingType && !LISTING_TYPES.includes(listingType)) {
      return response.status(400).json({ message: 'Enter a valid listing type' });
    }

    if (pricingMode && !PRICING_MODES.includes(pricingMode)) {
      return response.status(400).json({ message: 'Enter a valid pricing mode' });
    }

    if (!SORT_OPTIONS[sort]) {
      return response.status(400).json({ message: 'Enter a valid sorting option' });
    }

    const parsedMinimum = parsePrice(minPrice, 'Minimum price');
    const parsedMaximum = parsePrice(maxPrice, 'Maximum price');
    if (parsedMinimum.error || parsedMaximum.error) {
      return response.status(400).json({
        message: parsedMinimum.error ?? parsedMaximum.error,
      });
    }

    if (
      parsedMinimum.value !== undefined &&
      parsedMaximum.value !== undefined &&
      parsedMinimum.value > parsedMaximum.value
    ) {
      return response.status(400).json({ message: 'Minimum price cannot exceed maximum price' });
    }

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
    const filter = { status: 'active' };

    if (q?.trim()) {
      const queryExpression = searchText(q.trim());
      filter.$or = [
        { name: queryExpression },
        { category: queryExpression },
        { description: queryExpression },
        { qualityGrade: queryExpression },
        { 'farmLocation.district': queryExpression },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (listingType) {
      filter.listingType = listingType;
    }

    if (pricingMode) {
      filter.pricingMode = pricingMode;
    }

    if (district?.trim()) {
      filter['farmLocation.district'] = exactText(district.trim());
    }

    if (parsedMinimum.value !== undefined || parsedMaximum.value !== undefined) {
      filter.fixedPrice = {};
      if (parsedMinimum.value !== undefined) {
        filter.fixedPrice.$gte = parsedMinimum.value;
      }
      if (parsedMaximum.value !== undefined) {
        filter.fixedPrice.$lte = parsedMaximum.value;
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('farmer', 'name')
        .sort(SORT_OPTIONS[sort])
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      Product.countDocuments(filter),
    ]);

    return response.status(200).json({
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMarketplaceProduct(request, response, next) {
  try {
    const { productId } = request.params;

    if (!isValidMongoId(productId)) {
      return response.status(400).json({ message: 'Enter a valid product ID' });
    }

    const product = await Product.findOne({
      _id: productId,
      status: 'active',
    }).populate('farmer', 'name');

    if (!product) {
      return response.status(404).json({ message: 'Product not found' });
    }

    return response.status(200).json({ product });
  } catch (error) {
    return next(error);
  }
}
