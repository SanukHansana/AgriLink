import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { PurchaseRequestForm } from '../src/components/buyer/purchase-request-form';

jest.mock('../src/components/map-canvas', () => ({ MapCanvas: () => null }));
jest.mock('../src/hooks/use-buyer-profile', () => ({ useBuyerProfile: () => ({ profile: { deliveryLocations: [{ addressLine: 'Main Road', city: 'Kandy', district: 'Kandy', latitude: 7.29, longitude: 80.63, isDefault: true }] } }) }));
afterEach(async () => { await cleanup(); });

test('Wanted requests submit the chosen saved delivery address and pin', async () => {
  const submit = jest.fn();
  await render(<PurchaseRequestForm isSubmitting={false} onSubmit={submit} submitLabel="Publish Wanted item" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Use my saved delivery location' }));
  expect(screen.getByText('✓ Location selected')).toBeTruthy();
  expect(screen.queryByLabelText('Latitude')).toBeNull();
  expect(screen.getByLabelText('District').props.value).toBe('Kandy');
  await fireEvent.changeText(screen.getByLabelText('Product wanted'), 'Tomatoes');
  await fireEvent.changeText(screen.getByLabelText('Quantity'), '20');
  await fireEvent.changeText(screen.getByLabelText('Maximum price per unit (LKR)'), '200');
  await fireEvent.changeText(screen.getByLabelText('Needed by'), '2026-12-20');
  await fireEvent.press(screen.getByRole('button', { name: 'Publish Wanted item' }));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ deliveryLocation: { addressLine: 'Main Road', city: 'Kandy', district: 'Kandy', latitude: 7.29, longitude: 80.63 } }));
});
