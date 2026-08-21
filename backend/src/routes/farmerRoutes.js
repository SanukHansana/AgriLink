import { Router } from 'express';

import {
  createFarmerProfile,
  deleteFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from '../controllers/farmer/farmerProfileController.js';
import {
  createFarmerProduct,
  deactivateFarmerProduct,
  getFarmerProduct,
  getFarmerProducts,
  updateFarmerProduct,
} from '../controllers/farmer/productController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('farmer'));

router
  .route('/profile')
  .post(createFarmerProfile)
  .get(getFarmerProfile)
  .patch(updateFarmerProfile)
  .delete(deleteFarmerProfile);

router.route('/products').post(createFarmerProduct).get(getFarmerProducts);
router
  .route('/products/:productId')
  .get(getFarmerProduct)
  .patch(updateFarmerProduct)
  .delete(deactivateFarmerProduct);

export default router;
