import { Router } from 'express';
import { updateHarvest } from '../controllers/farmer/harvestController.js';
import { counterBid } from '../controllers/buyer/bidActionsController.js';
import Product from '../models/Product.js';
import { isValidMongoId } from '../utils/validation.js';

import { getFarmerBids, updateFarmerBidStatus } from '../controllers/farmer/bidController.js';
import {
  addCooperativeContribution,
  createCooperative,
  getCooperative,
  getCooperatives,
  joinCooperative,
  leaveCooperative,
  publishCooperativeProduct,
} from '../controllers/farmer/cooperativeController.js';

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
router.patch('/products/:productId/harvest', updateHarvest);
router.patch('/products/:productId/auction', async (request, response) => {
  if (!isValidMongoId(request.params.productId) || typeof request.body.enabled !== 'boolean') return response.status(400).json({ message: 'Provide a valid product and auction setting' });
  const product = await Product.findOneAndUpdate({ _id: request.params.productId, farmer: request.user._id, status: 'active', pricingMode: { $in: ['bidding', 'both'] }, biddingClosesAt: { $gt: new Date() } }, { $set: { autoAcceptHighestBid: request.body.enabled } }, { new: true });
  if (!product) return response.status(409).json({ message: 'Only open auctions can be changed' });
  return response.json({ product });
});
router
  .route('/products/:productId')
  .get(getFarmerProduct)
  .patch(updateFarmerProduct)
  .delete(deactivateFarmerProduct);

router.get('/bids', getFarmerBids);
router.patch('/bids/:bidId/status', updateFarmerBidStatus);
router.patch('/bids/:bidId/counter', counterBid);

router.get('/orders', getFarmerOrders);
router.get('/orders/:orderId', getFarmerOrder);
router.patch('/orders/:orderId/status', updateFarmerOrderStatus);

router.route('/cooperatives').post(createCooperative).get(getCooperatives);
router.get('/cooperatives/:cooperativeId', getCooperative);
router.post('/cooperatives/:cooperativeId/join', joinCooperative);
router.delete('/cooperatives/:cooperativeId/membership', leaveCooperative);
router.post('/cooperatives/:cooperativeId/contributions', addCooperativeContribution);
router.post(
  '/cooperatives/:cooperativeId/product-pools/:poolId/list',
  publishCooperativeProduct,
);

export default router;
