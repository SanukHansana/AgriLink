import { Router } from 'express';

import {
  acceptDeliveryJob,
  getDriverDeliveryJob,
  getDriverDeliveryJobs,
  updateDeliveryJobStatus,
} from '../controllers/driver/deliveryJobController.js';
import {
  createDriverProfile,
  deleteDriverProfile,
  getDriverProfile,
  updateDriverProfile,
} from '../controllers/driver/driverProfileController.js';
import {
  createDeliveryIssue,
  getDeliveryIssues,
  getDriverEarnings,
} from '../controllers/driver/driverReportController.js';
import {
  createVehicle,
  deleteDriverVehicle,
  getDriverVehicle,
  getDriverVehicles,
  updateDriverVehicle,
} from '../controllers/driver/vehicleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('driver'));

router
  .route('/profile')
  .post(createDriverProfile)
  .get(getDriverProfile)
  .patch(updateDriverProfile)
  .delete(deleteDriverProfile);

router.route('/vehicles').post(createVehicle).get(getDriverVehicles);
router
  .route('/vehicles/:vehicleId')
  .get(getDriverVehicle)
  .patch(updateDriverVehicle)
  .delete(deleteDriverVehicle);

router.get('/jobs', getDriverDeliveryJobs);
router.get('/jobs/:jobId', getDriverDeliveryJob);
router.post('/jobs/:jobId/accept', acceptDeliveryJob);
router.patch('/jobs/:jobId/status', updateDeliveryJobStatus);
router.get('/earnings', getDriverEarnings);
router.route('/issues').post(createDeliveryIssue).get(getDeliveryIssues);

export default router;
