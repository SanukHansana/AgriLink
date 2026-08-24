import AssistanceRequest from '../../models/AssistanceRequest.js';
import Notice from '../../models/Notice.js';
import Order from '../../models/Order.js';
import ReportedListing from '../../models/ReportedListing.js';
import User from '../../models/User.js';

export async function getAdvisoryReportOverview(_request, response, next) {
  try {
    const [trade, activeFarmers, requestsResolved, activeNotices, pendingReports] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDetails' } },
        { $unwind: '$productDetails' },
        { $facet: {
          totals: [{ $group: { _id: null, totalTradeValue: { $sum: '$totalAmount' }, totalQuantity: { $sum: '$quantity' } } }],
          categories: [{ $group: { _id: '$productDetails.category', quantity: { $sum: '$quantity' }, value: { $sum: '$totalAmount' } } }, { $sort: { value: -1 } }],
          crops: [{ $group: { _id: { name: '$productDetails.name', district: '$productDetails.farmLocation.district' }, quantity: { $sum: '$quantity' }, value: { $sum: '$totalAmount' } } }, { $sort: { value: -1 } }, { $limit: 10 }],
        } },
      ]),
      User.countDocuments({ role: 'farmer', isActive: true }),
      AssistanceRequest.countDocuments({ status: { $in: ['approved', 'rejected', 'resolved'] } }),
      Notice.countDocuments({ status: 'published' }),
      ReportedListing.countDocuments({ status: { $in: ['pending', 'inReview'] } }),
    ]);

    const result = trade[0] ?? { totals: [], categories: [], crops: [] };
    const totals = result.totals[0] ?? { totalTradeValue: 0, totalQuantity: 0 };
    const categoryTrade = result.categories.map((item) => ({
      category: item._id,
      quantity: item.quantity,
      value: item.value,
      percentage: totals.totalTradeValue > 0 ? Number(((item.value / totals.totalTradeValue) * 100).toFixed(1)) : 0,
    }));
    const topCrops = result.crops.map((item) => ({ name: item._id.name, district: item._id.district, quantity: item.quantity, estimatedValue: item.value }));

    return response.status(200).json({
      metrics: { totalTradeValue: totals.totalTradeValue, totalQuantity: totals.totalQuantity, activeFarmers, requestsResolved, activeNotices, pendingReports },
      categoryTrade,
      topCrops,
      generatedAt: new Date(),
    });
  } catch (error) {
    return next(error);
  }
}
