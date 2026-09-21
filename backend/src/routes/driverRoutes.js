import { Router } from 'express';
import { completeStop, shareLocation } from '../controllers/driver/locationController.js';
import { driverRecovery } from '../controllers/driver/workflowController.js';
import DeliveryJob from '../models/DeliveryJob.js';
import { planRoute } from '../services/route-planning.js';
import { isValidMongoId } from '../utils/validation.js';

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
router.patch('/jobs/:jobId/location', shareLocation);
router.patch('/jobs/:jobId/stops', completeStop);
router.post('/jobs/:jobId/recovery', driverRecovery);
router.get('/jobs/:jobId/route', async (request, response) => {
  if (!isValidMongoId(request.params.jobId)) return response.status(400).json({ message: 'Invalid delivery ID' });
  const job = await DeliveryJob.findOne({ _id: request.params.jobId, assignedDriver: request.user._id, status: { $in: ['accepted', 'collecting', 'inTransit', 'paused'] } });
  if (!job) return response.status(404).json({ message: 'Assigned delivery not found' });
  return response.json(planRoute(job));
});
router.get('/earnings', getDriverEarnings);
router.route('/issues').post(createDeliveryIssue).get(getDeliveryIssues);

export default router;
