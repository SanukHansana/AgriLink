import { fail } from './bidding.js';
export function requireOrderPayment(order) {
  if (order.paymentStatus !== 'paid') fail('Buyer must pay for the accepted order before preparation or delivery', 409);
}
export function validateDemoPayment(body, now = new Date()) {
  if (process.env.NODE_ENV === 'production' || process.env.MOCK_PAYMENTS_ENABLED === 'false') fail('Mock payments are disabled. Real payment processing has not been configured.', 503);
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(body?.expiry ?? '');
  if (body?.provider !== 'mock' || body?.last4 !== '4242' || !match || new Date(2000 + Number(match[2]), Number(match[1]), 1) <= now) fail('Use a valid demo card with a future expiry');
}
