import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import FarmerOrdersScreen from '../src/app/(app)/farmer/orders';
import { useFarmerOrders } from '../src/hooks/use-farmer-orders';
import { updateFarmerOrderStatus } from '../src/services/farmer-service';
import type { BuyerOrder } from '../src/types/transactions';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../src/hooks/use-farmer-orders', () => ({ useFarmerOrders: jest.fn() }));
jest.mock('../src/services/farmer-service', () => ({ updateFarmerOrderStatus: jest.fn() }));
jest.mock('../src/services/api', () => ({ getApiErrorMessage: () => 'Buyer must pay first' }));
const order = { _id: 'order', orderCode: 'AG-1', status: 'confirmed', paymentStatus: 'unpaid', product: 'product', buyer: 'buyer', quantity: 1, unit: 'kg', totalAmount: 100, createdAt: '2026-10-14', deliveryAddress: { addressLine: 'Street', city: 'Colombo' } } as BuyerOrder;
function setup(value: BuyerOrder) { jest.mocked(useFarmerOrders).mockReturnValue({ orders: [value], isLoading: false, error: null, refresh: jest.fn(), setOrders: jest.fn() }); }
afterEach(async () => { await cleanup(); });
test('accepted unpaid orders explain waiting and disable preparation', async () => {
  setup(order); await render(<FarmerOrdersScreen />);
  const action = screen.getByRole('button', { name: 'Waiting for buyer payment' });
  expect(action.props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText('Wait until buyer pays. Preparation and delivery are locked.')).toBeTruthy();
  await fireEvent.press(action); expect(updateFarmerOrderStatus).not.toHaveBeenCalled();
});
test('paid accepted orders enable preparation and show API errors', async () => {
  setup({ ...order, paymentStatus: 'paid' });
  jest.mocked(updateFarmerOrderStatus).mockRejectedValue(new Error('Payment changed'));
  await render(<FarmerOrdersScreen />);
  const action = screen.getByRole('button', { name: 'Start Preparing' });
  expect(action.props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(action); expect(await screen.findByText('Buyer must pay first')).toBeTruthy();
});
