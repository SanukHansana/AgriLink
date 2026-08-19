import { Router } from 'express';

import {
  createBid,
  getBuyerBid,
  getBuyerBids,
} from '../controllers/buyer/bidController.js';
import {
  createBuyerProfile,
  deleteBuyerProfile,
  getBuyerProfile,
  updateBuyerProfile,
} from '../controllers/buyer/buyerProfileController.js';
import {
  createBuyerComplaint,
  createBuyerReview,
} from '../controllers/buyer/feedbackController.js';
import {
  createAdvanceOrder,
  createFixedPriceOrder,
  getBuyerOrder,
  getBuyerOrders,
} from '../controllers/buyer/orderController.js';
import {
  getMarketplaceProduct,
  searchMarketplaceProducts,
} from '../controllers/buyer/marketplaceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router
  .route('/profile')
  .post(createBuyerProfile)
  .get(getBuyerProfile)
  .patch(updateBuyerProfile)
  .delete(deleteBuyerProfile);

router.post('/bids', createBid);
router.get('/bids', getBuyerBids);
router.get('/bids/:bidId', getBuyerBid);

router.get('/marketplace/products', searchMarketplaceProducts);
router.get('/marketplace/products/:productId', getMarketplaceProduct);

router.post('/orders/fixed-price', createFixedPriceOrder);
router.post('/orders/advance', createAdvanceOrder);
router.get('/orders', getBuyerOrders);
router.get('/orders/:orderId', getBuyerOrder);
router.post('/orders/:orderId/reviews', createBuyerReview);
router.post('/orders/:orderId/complaints', createBuyerComplaint);

export default router;
