import AssistanceRequest from '../../models/AssistanceRequest.js';
import Notice from '../../models/Notice.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import FarmerProfile from '../../models/FarmerProfile.js';
import ReportedListing from '../../models/ReportedListing.js';
import User from '../../models/User.js';
import { officerDistrict, districtPattern } from '../../services/officer-access.js';
import { tradePipeline } from '../../services/advisory-analytics.js';

export async function getAdvisoryReportOverview(request, response, next) {
  try {
    const district = officerDistrict(request.user);
    const pattern = districtPattern(district);
    const [farmers, products] = await Promise.all([
      FarmerProfile.find({ 'farmLocation.district': pattern }).distinct('user'),
      Product.find({ 'farmLocation.district': pattern }).distinct('_id'),
    ]);
    const [trade, activeFarmers, requestsResolved, activeNotices, pendingReports] = await Promise.all([
      Order.aggregate(tradePipeline(district)),
      User.countDocuments({ _id: { $in: farmers }, role: 'farmer', isActive: true }),
      AssistanceRequest.countDocuments({ 'farmLocation.district': pattern, status: 'resolved' }),
      Notice.countDocuments({ status: 'published', $or: [{ targetAudience: 'allFarmers' }, { targetDistrict: pattern }] }),
      ReportedListing.countDocuments({ product: { $in: products }, status: { $in: ['pending', 'inReview'] } }),
    ]);
    const result = trade[0] ?? { totals: [], quantities: [], categories: [], crops: [] };
    const totalTradeValue = result.totals[0]?.totalTradeValue ?? 0;
    return response.json({
      district,
      metrics: { totalTradeValue, quantityByUnit: result.quantities.map((item) => ({ unit: item._id, quantity: item.quantity })), activeFarmers, requestsResolved, activeNotices, pendingReports },
      categoryTrade: result.categories.map((item) => ({ category: item._id, value: item.value, percentage: totalTradeValue > 0 ? Number((item.value / totalTradeValue * 100).toFixed(1)) : 0 })),
      topCrops: result.crops.map((item) => ({ name: item._id.name, district: item._id.district, unit: item._id.unit, quantity: item.quantity, estimatedValue: item.value })),
      generatedAt: new Date(),
    });
  } catch (error) { return next(error); }
}
