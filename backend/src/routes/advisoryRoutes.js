import { Router } from 'express';

import {
  createAssistanceRequest,
  deleteAssistanceRequest,
  getAssistanceRequest,
  getAssistanceRequests,
  respondToAssistanceRequest,
  reviewAssistanceRequest,
  updateAssistanceRequest,
} from '../controllers/advisory/assistanceRequestController.js';
import {
  archiveNotice,
  createNotice,
  deleteNotice,
  getNotice,
  getNotices,
  publishNotice,
  updateNotice,
} from '../controllers/advisory/noticeController.js';
import {
  createOfficerProfile,
  deleteOfficerProfile,
  getOfficerProfile,
  updateOfficerProfile,
} from '../controllers/advisory/officerProfileController.js';
import {
  archiveQualityGuideline,
  createQualityGuideline,
  getQualityGuidelines,
  updateQualityGuideline,
} from '../controllers/advisory/qualityGuidelineController.js';
import {
  createSurplusAdvisory,
  getSurplusAdvisories,
  resolveSurplusAdvisory,
  updateSurplusAdvisory,
} from '../controllers/advisory/surplusAdvisoryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();
const allowAdvisoryUsers = requireRole('farmer', 'agricultureOfficer');
const requireFarmer = requireRole('farmer');
const requireOfficer = requireRole('agricultureOfficer');

router.use(requireAuth);

router
  .route('/officer-profile')
  .post(requireOfficer, createOfficerProfile)
  .get(requireOfficer, getOfficerProfile)
  .patch(requireOfficer, updateOfficerProfile)
  .delete(requireOfficer, deleteOfficerProfile);

router
  .route('/requests')
  .post(requireFarmer, createAssistanceRequest)
  .get(allowAdvisoryUsers, getAssistanceRequests);
router
  .route('/requests/:requestId')
  .get(allowAdvisoryUsers, getAssistanceRequest)
  .patch(requireFarmer, updateAssistanceRequest)
  .delete(requireFarmer, deleteAssistanceRequest);
router.patch('/requests/:requestId/review', requireOfficer, reviewAssistanceRequest);
router.post('/requests/:requestId/responses', requireOfficer, respondToAssistanceRequest);

router
  .route('/notices')
  .post(requireOfficer, createNotice)
  .get(allowAdvisoryUsers, getNotices);
router
  .route('/notices/:noticeId')
  .get(allowAdvisoryUsers, getNotice)
  .patch(requireOfficer, updateNotice)
  .delete(requireOfficer, deleteNotice);
router.post('/notices/:noticeId/publish', requireOfficer, publishNotice);
router.post('/notices/:noticeId/archive', requireOfficer, archiveNotice);

router
  .route('/quality-guidelines')
  .post(requireOfficer, createQualityGuideline)
  .get(allowAdvisoryUsers, getQualityGuidelines);
router.patch('/quality-guidelines/:guidelineId', requireOfficer, updateQualityGuideline);
router.post(
  '/quality-guidelines/:guidelineId/archive',
  requireOfficer,
  archiveQualityGuideline,
);

router
  .route('/surplus-advisories')
  .post(requireOfficer, createSurplusAdvisory)
  .get(allowAdvisoryUsers, getSurplusAdvisories);
router.patch('/surplus-advisories/:advisoryId', requireOfficer, updateSurplusAdvisory);
router.post(
  '/surplus-advisories/:advisoryId/resolve',
  requireOfficer,
  resolveSurplusAdvisory,
);

export default router;
