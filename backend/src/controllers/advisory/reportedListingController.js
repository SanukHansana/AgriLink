import mongoose from 'mongoose';
import { officerDistrict, districtPattern } from '../../services/officer-access.js';
import { fail } from '../../services/bidding.js';
import Product from '../../models/Product.js';
import ReportedListing, {
  LISTING_REPORT_REASONS,
  LISTING_REPORT_RISKS,
  LISTING_REPORT_STATUSES,
} from '../../models/ReportedListing.js';
import { isValidMongoId } from '../../utils/validation.js';

function populateReport(query) {
  return query
    .populate({ path: 'product', select: 'name category fixedPrice unit status images farmer', populate: { path: 'farmer', select: 'name email' } })
    .populate('farmer', 'name email')
    .populate('reportedBy', 'name email')
    .populate('reviewedBy', 'name email');
}

export async function createReportedListing(request, response, next) {
  try {
    const { advertisedPrice, description, observedPrice, productId, reason } = request.body;
    if (!isValidMongoId(productId)) return response.status(400).json({ message: 'Enter a valid product ID' });
    if (!LISTING_REPORT_REASONS.includes(reason)) return response.status(400).json({ message: 'Enter a valid listing report reason' });

    const product = await Product.findById(productId);
    if (!product) return response.status(404).json({ message: 'Product listing not found' });
    const duplicate = await ReportedListing.exists({ product: productId, reportedBy: request.user._id, status: { $in: ['pending', 'inReview'] } });
    if (duplicate) return response.status(409).json({ message: 'You already have an active report for this listing' });

    const report = await ReportedListing.create({ advertisedPrice, description, observedPrice, product: product._id, farmer: product.farmer, reason, reportedBy: request.user._id });
    await report.populate([
      { path: 'product', select: 'name category fixedPrice unit status images farmer', populate: { path: 'farmer', select: 'name email' } },
      { path: 'farmer', select: 'name email' },
      { path: 'reportedBy', select: 'name email' },
    ]);
    return response.status(201).json({ message: 'Product listing reported successfully', report });
  } catch (error) {
    return next(error);
  }
}

export async function getReportedListings(request, response, next) {
  try {
    const { reason, risk, status } = request.query;
    if (reason && !LISTING_REPORT_REASONS.includes(reason)) return response.status(400).json({ message: 'Enter a valid report reason filter' });
    if (risk && !LISTING_REPORT_RISKS.includes(risk)) return response.status(400).json({ message: 'Enter a valid report risk filter' });
    if (status && !LISTING_REPORT_STATUSES.includes(status)) return response.status(400).json({ message: 'Enter a valid report status filter' });
    const products = await Product.find({ 'farmLocation.district': districtPattern(officerDistrict(request.user)) }).distinct('_id');
    const filter = { product: { $in: products } };
    if (reason) filter.reason = reason;
    if (risk) filter.risk = risk;
    if (status) filter.status = status;
    const reports = await populateReport(ReportedListing.find(filter)).sort({ createdAt: -1 });
    const rank = { high: 3, medium: 2, low: 1 };
    reports.sort((a, b) => rank[b.risk] - rank[a.risk]);
    return response.status(200).json({ reports });
  } catch (error) {
    return next(error);
  }
}

export async function reviewReportedListing(request, response, next) {
  try {
    const { reportId } = request.params;
    const { action, reviewNote, risk } = request.body;
    if (!isValidMongoId(reportId)) return response.status(400).json({ message: 'Enter a valid listing report ID' });
    if (!['review', 'suspend', 'dismiss', 'resolve'].includes(action)) return response.status(400).json({ message: 'Enter a valid moderation action' });
    if (risk && !LISTING_REPORT_RISKS.includes(risk)) return response.status(400).json({ message: 'Enter a valid listing risk level' });

    const district = officerDistrict(request.user);
    const statusByAction = { review: 'inReview', suspend: 'suspended', dismiss: 'dismissed', resolve: 'resolved' };
    const report = await mongoose.connection.transaction(async (session) => {
      const report = await ReportedListing.findById(reportId).session(session);
      if (!report) fail('Reported listing not found', 404);
      const product = await Product.findOne({ _id: report.product, 'farmLocation.district': districtPattern(district) }).session(session);
      if (!product) fail('Listing is outside your service district', 403);
      const owner = report.assignedOfficer ?? report.reviewedBy;
      if (owner && String(owner) !== String(request.user._id)) fail('This report belongs to another officer. Ask an administrator to reassign it.', 409);
      if (['dismissed', 'resolved'].includes(report.status)) fail('This listing report is closed', 409);
      if (action !== 'review' && (typeof reviewNote !== 'string' || reviewNote.trim().length < 10)) fail('Explain the moderation decision in at least 10 characters');
      const from = report.status;
      report.status = statusByAction[action]; report.assignedOfficer = request.user._id;
      report.reviewedBy = request.user._id; report.reviewedAt = new Date();
      if (reviewNote !== undefined) report.reviewNote = reviewNote;
      if (risk !== undefined) report.risk = risk;
      report.history.push({ action, actor: request.user._id, fromStatus: from, toStatus: report.status, note: reviewNote });
      if (action === 'suspend') { product.status = 'inactive'; await product.save({ session }); }
      await report.save({ session }); return report;
    });
    await report.populate([
      { path: 'product', select: 'name category fixedPrice unit status images farmer', populate: { path: 'farmer', select: 'name email' } },
      { path: 'farmer', select: 'name email' },
      { path: 'reportedBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' },
    ]);
    return response.status(200).json({ message: `Listing report ${statusByAction[action]} successfully`, report });
  } catch (error) {
    return next(error);
  }
}
