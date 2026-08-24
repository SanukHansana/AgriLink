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
    const filter = {};
    if (reason) filter.reason = reason;
    if (risk) filter.risk = risk;
    if (status) filter.status = status;
    const reports = await populateReport(ReportedListing.find(filter)).sort({ risk: -1, createdAt: -1 });
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

    const report = await ReportedListing.findById(reportId);
    if (!report) return response.status(404).json({ message: 'Reported listing not found' });
    const statusByAction = { review: 'inReview', suspend: 'suspended', dismiss: 'dismissed', resolve: 'resolved' };
    report.status = statusByAction[action];
    report.reviewedBy = request.user._id;
    report.reviewedAt = new Date();
    if (reviewNote !== undefined) report.reviewNote = reviewNote;
    if (risk !== undefined) report.risk = risk;
    await report.save();
    if (action === 'suspend') await Product.findByIdAndUpdate(report.product, { $set: { status: 'inactive' } });
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
