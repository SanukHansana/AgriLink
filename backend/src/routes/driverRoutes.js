import { Router } from 'express';

import {
  acceptDeliveryJob,
  getDriverDeliveryJob,
  getDriverDeliveryJobs,
} from '../controllers/driver/deliveryJobController.js';
import {
  createDriverProfile,
  deleteDriverProfile,
  getDriverProfile,
  updateDriverProfile,
} from '../controllers/driver/driverProfileController.js';
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

export default router;
