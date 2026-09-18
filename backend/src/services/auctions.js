import Product from '../models/Product.js';
import Bid from '../models/Bid.js';
import { acceptBid, expireBids } from './bidding.js';

export async function settleAuctions() {
  const products = await Product.find({ autoAcceptHighestBid: true, auctionProcessedAt: { $exists: false }, biddingClosesAt: { $lte: new Date() } }).limit(50);
  for (const product of products) {
    const bids = await Bid.find({ product: product._id, status: 'active' }).sort({ bidAmount: -1, createdAt: 1, _id: 1 });
    let completed = false;
    for (const bid of bids) {
      try { await acceptBid(bid._id, product.farmer, { automatic: true }); completed = true; break; }
      catch (error) { if (![400, 404, 409].includes(error.statusCode)) throw error; }
    }
    if (!completed) await Product.updateOne({ _id: product._id, auctionProcessedAt: { $exists: false }, autoAcceptHighestBid: true }, { $set: { auctionProcessedAt: new Date() } });
    await expireBids({ product: product._id });
  }
}

export function startAuctionWorker() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await settleAuctions(); } catch (error) { console.error('Auction settlement failed:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(run, 30000);
  timer.unref();
  void run();
  return () => clearInterval(timer);
}
