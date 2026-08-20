import { Router } from 'express';

import {
  createDeliveryJob,
  deleteFarmerDeliveryJob,
  getFarmerDeliveryJob,
  getFarmerDeliveryJobs,
  updateFarmerDeliveryJob,
} from '../controllers/driver/deliveryJobController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('farmer'));

router.route('/jobs').post(createDeliveryJob).get(getFarmerDeliveryJobs);
router
  .route('/jobs/:jobId')
  .get(getFarmerDeliveryJob)
  .patch(updateFarmerDeliveryJob)
  .delete(deleteFarmerDeliveryJob);

export default router;
