import { Router } from 'express';
import { getSubscription, changeSubscription } from '../controllers/buyer/subscriptionController.js';
import { changeBuyerBid } from '../controllers/buyer/bidActionsController.js';
import { getOrderDelivery } from '../controllers/driver/locationController.js';

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
  updateRequestedDeliveryDate,
  payBuyerOrder,
  receiveBuyerOrder,
} from '../controllers/buyer/orderController.js';
import {
  getMarketplaceProduct,
  searchMarketplaceProducts,
} from '../controllers/buyer/marketplaceController.js';
import {
  createPurchaseRequest,
  deletePurchaseRequest,
  getPurchaseRequest,
  getPurchaseRequests,
  updatePurchaseRequest,
} from '../controllers/buyer/purchaseRequestController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole('buyer'));
router.get('/subscription', getSubscription);
router.patch('/subscription', changeSubscription);

router
  .route('/profile')
  .post(createBuyerProfile)
  .get(getBuyerProfile)
  .patch(updateBuyerProfile)
  .delete(deleteBuyerProfile);

router.post('/bids', createBid);
router.get('/bids', getBuyerBids);
router.get('/bids/:bidId', getBuyerBid);
router.patch('/bids/:bidId', changeBuyerBid);

router.get('/marketplace/products', searchMarketplaceProducts);
router.get('/marketplace/products/:productId', getMarketplaceProduct);

router.post('/orders/fixed-price', createFixedPriceOrder);
router.post('/orders/advance', createAdvanceOrder);
router.get('/orders', getBuyerOrders);
router.get('/orders/:orderId', getBuyerOrder);
router.post('/orders/:orderId/payment', payBuyerOrder);
router.post('/orders/:orderId/received', receiveBuyerOrder);
router.patch('/orders/:orderId/delivery-date', updateRequestedDeliveryDate);
router.get('/orders/:orderId/delivery', getOrderDelivery);
router.post('/orders/:orderId/reviews', createBuyerReview);
router.post('/orders/:orderId/complaints', createBuyerComplaint);

router.route('/purchase-requests').post(createPurchaseRequest).get(getPurchaseRequests);
router
  .route('/purchase-requests/:requestId')
  .get(getPurchaseRequest)
  .patch(updatePurchaseRequest)
  .delete(deletePurchaseRequest);

export default router;
