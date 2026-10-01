import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BidActions } from '../src/components/buyer/bid-actions';
import { api } from '../src/services/api';
import type { BuyerBid } from '../src/types/transactions';

jest.mock('../src/services/api', () => ({ api: { patch: jest.fn() }, getApiErrorMessage: () => 'Request failed' }));
const patch = jest.mocked(api.patch);
const bid: BuyerBid = { _id: 'bid-1', buyer: 'buyer', product: 'product', bidAmount: 120, quantity: 10, unit: 'kg', totalAmount: 1200, status: 'active', createdAt: '2026-09-30', updatedAt: '2026-09-30' };
beforeEach(() => { patch.mockResolvedValue({ data: {} }); });
afterEach(async () => { await cleanup(); });

test('edits price and quantity and refreshes only after saving', async () => {
  const changed = jest.fn();
  await render(<BidActions bid={bid} onChange={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Edit bid' }));
  await fireEvent.changeText(screen.getByLabelText('Bid price per unit'), '150');
  await fireEvent.changeText(screen.getByLabelText('Quantity'), '12');
  await fireEvent.press(screen.getByRole('button', { name: 'Save revised bid' }));
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
  expect(patch).toHaveBeenCalledWith('/buyers/bids/bid-1', { action: 'edit', bidAmount: 150, quantity: 12 });
  expect(screen.queryByLabelText('Quantity')).toBeNull();
});

test('accepts a farmer counter-offer', async () => {
  const changed = jest.fn();
  await render(<BidActions bid={{ ...bid, status: 'countered', counterAmount: 140 }} onChange={changed} />);
  expect(screen.getByText(/Farmer counter-offer: LKR 140/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Accept counter-offer & place order' }));
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
  expect(patch).toHaveBeenCalledWith('/buyers/bids/bid-1', expect.objectContaining({ action: 'acceptCounter' }));
});

test('shows server failure without reporting a successful change', async () => {
  patch.mockRejectedValue(new Error('Rejected'));
  const changed = jest.fn();
  await render(<BidActions bid={bid} onChange={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Withdraw bid' }));
  expect(await screen.findByText('Request failed')).toBeTruthy();
  expect(changed).not.toHaveBeenCalled();
});

test('disables bid actions while an update is pending', async () => {
  let finish!: () => void;
  patch.mockReturnValueOnce(new Promise((resolve) => {
    finish = () => resolve({ data: {} } as Awaited<ReturnType<typeof api.patch>>);
  }));
  const changed = jest.fn();
  await render(<BidActions bid={bid} onChange={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Withdraw bid' }));
  expect(screen.getByRole('button', { name: 'Withdraw bid' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Edit bid' })).toBeDisabled();
  expect(changed).not.toHaveBeenCalled();
  finish();
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Withdraw bid' })).toBeEnabled();
});

test.each(['accepted', 'withdrawn', 'rejected', 'expired'] as const)('hides mutation actions for %s bids', async (status) => {
  await render(<BidActions bid={{ ...bid, status }} onChange={jest.fn()} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(patch).not.toHaveBeenCalled();
});
