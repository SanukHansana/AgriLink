import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { OrderPaymentActions } from '../src/components/buyer/order-payment-actions';
import type { BuyerOrder } from '../src/types/transactions';
import { api } from '../src/services/api';
jest.mock('../src/services/api', () => ({ api: { post: jest.fn(async () => ({})) }, getApiErrorMessage: () => 'Payment failed' }));
jest.mock('../src/components/buyer/mock-card-checkout', () => {
  const { Button } = require('react-native');
  return { MockCardCheckout: ({ onConfirm }: { onConfirm: (card: object) => void }) => <Button title="Submit demo card" onPress={() => onConfirm({ last4: '4242', expiry: '12/39' })} /> };
});
afterEach(async () => { await cleanup(); });
const order = { _id: 'order-1', status: 'confirmed', quantity: 2, unit: 'kg', totalAmount: 200, orderCode: 'AG-1' } as BuyerOrder;
test('accepted order requires checkout before submitting mock payment', async () => {
  const refresh = jest.fn();
  await render(<OrderPaymentActions order={order} onChange={refresh} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Pay for order (demo)' }));
  expect(api.post).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Submit demo card' }));
  expect(api.post).toHaveBeenCalledWith('/buyers/orders/order-1/payment', { provider: 'mock', last4: '4242', expiry: '12/39' });
  expect(refresh).toHaveBeenCalled();
});
test('pending order has no payment or receipt action', async () => {
  await render(<OrderPaymentActions order={{ ...order, status: 'pending' }} onChange={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Pay for order (demo)' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Confirm received' })).toBeNull();
});
