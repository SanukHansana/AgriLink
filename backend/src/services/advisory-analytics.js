import { districtPattern } from './officer-access.js';

export function tradePipeline(district) {
  return [
    { $match: { status: 'delivered' } },
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDetails' } },
    { $unwind: '$productDetails' },
    { $match: { 'productDetails.farmLocation.district': districtPattern(district) } },
    { $facet: {
      totals: [{ $group: { _id: null, totalTradeValue: { $sum: '$totalAmount' } } }],
      quantities: [{ $group: { _id: '$unit', quantity: { $sum: '$quantity' } } }],
      categories: [{ $group: { _id: '$productDetails.category', value: { $sum: '$totalAmount' } } }, { $sort: { value: -1 } }],
      crops: [{ $group: { _id: { name: '$productDetails.name', district: '$productDetails.farmLocation.district', unit: '$unit' }, quantity: { $sum: '$quantity' }, value: { $sum: '$totalAmount' } } }, { $sort: { value: -1 } }, { $limit: 10 }],
    } },
  ];
}
