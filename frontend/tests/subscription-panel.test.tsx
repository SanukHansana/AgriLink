import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SubscriptionPanel } from '../src/components/buyer/subscription-panel';
import { api } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), patch: jest.fn() }, getApiErrorMessage: () => 'Subscription update failed' }));
jest.mock('../src/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 'buyer-1' } }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}), removeItem: jest.fn(async () => {}) }));
async function checkout() {
  await fireEvent.press(await screen.findByRole('button', { name: 'Activate demo subscription' }));
  await fireEvent.changeText(screen.getByLabelText('Cardholder name'), 'Demo Buyer');
  await fireEvent.changeText(screen.getByLabelText('Demo card number'), '4242424242424242');
  await fireEvent.changeText(screen.getByLabelText('Expiry (MM/YY)'), '1239');
  await fireEvent.changeText(screen.getByLabelText('Security code'), '123');
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm demo subscription' }));
}
const get = jest.mocked(api.get), patch = jest.mocked(api.patch);
const inactive = { subscription: { provider: 'mock', status: 'inactive', expiresAt: null }, mockAvailable: true };
const active = { ...inactive, subscription: { provider: 'mock', status: 'active', expiresAt: '2026-11-02T00:00:00Z' } };
beforeEach(() => { get.mockResolvedValue({ data: inactive }); });
afterEach(async () => { await cleanup(); });

test('activates a demo subscription and displays its expiry', async () => {
  patch.mockResolvedValue({ data: active });
  await render(<SubscriptionPanel />);
  await checkout();
  expect(await screen.findByText('Subscription active')).toBeTruthy();
  expect(screen.getByText(/Expires:/)).toBeTruthy();
  expect(patch).toHaveBeenCalledWith('/buyers/subscription', { action: 'subscribe' });
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('agrilink-demo-card-buyer-1', JSON.stringify({ last4: '4242', expiry: '12/39' })));
});

test('invalid card details do not activate the subscription', async () => {
  await render(<SubscriptionPanel />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Activate demo subscription' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm demo subscription' }));
  expect(await screen.findByText('Enter a valid future expiry date (MM/YY).')).toBeTruthy();
  expect(patch).not.toHaveBeenCalled();
});

test('reuses a saved demo card without requesting full card details', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify({ last4: '4242', expiry: '12/39' }));
  patch.mockResolvedValue({ data: active });
  await render(<SubscriptionPanel />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Activate demo subscription' }));
  await screen.findByText('Demo Visa •••• 4242');
  expect(screen.queryByLabelText('Demo card number')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm demo subscription' }));
  expect(await screen.findByText('Subscription active')).toBeTruthy();
});

test('cancels the current subscription', async () => {
  get.mockResolvedValue({ data: active }); patch.mockResolvedValue({ data: inactive });
  await render(<SubscriptionPanel />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Cancel subscription' }));
  expect(await screen.findByText('Subscription inactive')).toBeTruthy();
  expect(patch).toHaveBeenCalledWith('/buyers/subscription', { action: 'cancel' });
});

test('failed activation keeps the buyer unsubscribed and shows the error', async () => {
  patch.mockRejectedValue(new Error('Unavailable'));
  await render(<SubscriptionPanel />);
  await checkout();
  expect(await screen.findByText('Subscription update failed')).toBeTruthy();
  expect(screen.getByText('Subscription inactive')).toBeTruthy();
});

test('does not offer mock activation when the server disables it', async () => {
  get.mockResolvedValue({ data: { ...inactive, mockAvailable: false } });
  await render(<SubscriptionPanel />);
  await waitFor(() => expect(screen.getByText('Demo subscriptions are unavailable on this server.')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Activate demo subscription' })).toBeNull();
});
