import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AdminDashboard from '../src/app/(app)/admin';
import { api } from '../src/services/api';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../src/contexts/auth-context', () => ({ useAuth: () => ({ user: { name: 'Administrator' }, logout: jest.fn() }) }));
jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), patch: jest.fn() }, getApiErrorMessage: () => 'Verification failed. Try again.' }));
const officer = { _id: 'officer-id', name: 'Officer Silva', email: 'officer@example.com', role: 'agricultureOfficer', isActive: true, isVerified: false };
beforeEach(() => {
  jest.mocked(api.get).mockResolvedValue({ data: { items: [officer], total: 1, pages: 1 } })
    .mockResolvedValueOnce({ data: { users: 1, activeUsers: 1, listings: 0, activeListings: 0, orders: 0, pendingOrders: 0, deliveredValue: 0 } });
  jest.mocked(api.patch).mockResolvedValue({ data: { user: { ...officer, isVerified: true } } });
});
afterEach(async () => { await cleanup(); });

test('verification opens a visible confirmation and sends the change only after confirmation', async () => {
  await render(<AdminDashboard />);
  await fireEvent.press(screen.getByRole('button', { name: 'Users' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Verify officer' }));
  expect(screen.getByText('Verify Officer Silva?')).toBeTruthy();
  expect(api.patch).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));
  await screen.findByText('Changes saved successfully.');
  expect(api.patch).toHaveBeenCalledWith('/admin/users/officer-id/verification', { isVerified: true });
});

test('cancel restores the verification action without sending a request', async () => {
  await render(<AdminDashboard />);
  await fireEvent.press(screen.getByRole('button', { name: 'Users' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Verify officer' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Verify officer' })).toBeEnabled());
  expect(api.patch).not.toHaveBeenCalled();
});

test('a failed verification unlocks the action and displays the failure', async () => {
  jest.mocked(api.patch).mockRejectedValue(new Error('Network failure'));
  await render(<AdminDashboard />);
  await fireEvent.press(screen.getByRole('button', { name: 'Users' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Verify officer' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm change' }));
  await screen.findByText('Verification failed. Try again.');
  expect(screen.getByRole('button', { name: 'Verify officer' })).toBeEnabled();
});
