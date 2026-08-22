import { Router } from 'express';

import { getFarmerBids, updateFarmerBidStatus } from '../controllers/farmer/bidController.js';

import {
  createFarmerProfile,
  deleteFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from '../controllers/farmer/farmerProfileController.js';
import {
  getFarmerOrder,
  getFarmerOrders,
  updateFarmerOrderStatus,
} from '../controllers/farmer/orderController.js';
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

router.get('/bids', getFarmerBids);
router.patch('/bids/:bidId/status', updateFarmerBidStatus);

router.get('/orders', getFarmerOrders);
router.get('/orders/:orderId', getFarmerOrder);
router.patch('/orders/:orderId/status', updateFarmerOrderStatus);

export default router;
