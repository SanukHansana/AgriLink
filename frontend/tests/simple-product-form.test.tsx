import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { ProductForm } from '../src/components/farmer/product-form';

jest.mock('../src/services/image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('../src/components/map-canvas', () => ({ MapCanvas: () => null }));
afterEach(async () => { await cleanup(); });

test('a basic listing uses the saved farm location and sensible optional defaults', async () => {
  const submit = jest.fn();
  await render(<ProductForm defaultLocation={{ district: 'Kandy', city: 'Kandy', addressLine: 'Farm Road', latitude: 7.29, longitude: 80.63 }} isSubmitting={false} onSubmit={submit} submitLabel="List product" />);
  expect(screen.queryByLabelText('Quality / Grade')).toBeNull();
  expect(screen.queryByLabelText('Minimum Order Quantity')).toBeNull();
  expect(screen.getByText('Farm Road, Kandy, Kandy')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Product Name'), 'Tomatoes');
  await fireEvent.changeText(screen.getByLabelText('Available Quantity'), '50');
  await fireEvent.changeText(screen.getByLabelText('Fixed Price per Unit (LKR)'), '200');
  await fireEvent.press(screen.getByRole('button', { name: 'List product' }));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tomatoes', availableQuantity: 50, fixedPrice: 200, minimumOrderQuantity: 1, farmLocation: { district: 'Kandy', city: 'Kandy', addressLine: 'Farm Road', latitude: 7.29, longitude: 80.63 } }));
});

test('optional details preserve entered values when collapsed', async () => {
  await render(<ProductForm defaultLocation={{ district: 'Kandy' }} isSubmitting={false} onSubmit={jest.fn()} submitLabel="Save" />);
  await fireEvent.press(screen.getByRole('button', { name: '+ More details (optional)' }));
  await fireEvent.changeText(screen.getByLabelText('Quality / Grade'), 'Grade A');
  await fireEvent.press(screen.getByRole('button', { name: '− More details (optional)' }));
  expect(screen.queryByLabelText('Quality / Grade')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: '+ More details (optional)' }));
  expect(screen.getByLabelText('Quality / Grade').props.value).toBe('Grade A');
});
