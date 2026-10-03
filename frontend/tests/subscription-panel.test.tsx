import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SubscriptionPanel } from '../src/components/buyer/subscription-panel';
import { api } from '../src/services/api';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), patch: jest.fn() }, getApiErrorMessage: () => 'Subscription update failed' }));
const get = jest.mocked(api.get), patch = jest.mocked(api.patch);
const inactive = { subscription: { provider: 'mock', status: 'inactive', expiresAt: null }, mockAvailable: true };
const active = { ...inactive, subscription: { provider: 'mock', status: 'active', expiresAt: '2026-11-02T00:00:00Z' } };
beforeEach(() => { get.mockResolvedValue({ data: inactive }); });
afterEach(async () => { await cleanup(); });

test('activates a demo subscription and displays its expiry', async () => {
  patch.mockResolvedValue({ data: active });
  await render(<SubscriptionPanel />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Activate demo subscription' }));
  expect(await screen.findByText('Subscription active')).toBeTruthy();
  expect(screen.getByText(/Expires:/)).toBeTruthy();
  expect(patch).toHaveBeenCalledWith('/buyers/subscription', { action: 'subscribe' });
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
  await fireEvent.press(await screen.findByRole('button', { name: 'Activate demo subscription' }));
  expect(await screen.findByText('Subscription update failed')).toBeTruthy();
  expect(screen.getByText('Subscription inactive')).toBeTruthy();
});

test('does not offer mock activation when the server disables it', async () => {
  get.mockResolvedValue({ data: { ...inactive, mockAvailable: false } });
  await render(<SubscriptionPanel />);
  await waitFor(() => expect(screen.getByText('Demo subscriptions are unavailable on this server.')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Activate demo subscription' })).toBeNull();
});
