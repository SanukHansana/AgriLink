import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import DriverUpdateStatusScreen from '../src/app/(app)/driver/status/[jobId]';
import { useDriverJob } from '../src/hooks/use-driver-job';
import type { DeliveryJob } from '../src/types/logistics';
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({ jobId: 'job' }) }));
jest.mock('../src/hooks/use-driver-job', () => ({ useDriverJob: jest.fn() }));
jest.mock('../src/services/image-picker', () => ({}));
jest.mock('../src/services/driver-service', () => ({ updateDriverJobStatus: jest.fn() }));
jest.mock('../src/services/api', () => ({ getApiErrorMessage: () => 'Error' }));
jest.mock('../src/components/driver/delivery-stops', () => {
  const { Text } = require('react-native');
  return { DeliveryStops: () => <Text>Pickup confirmation controls</Text> };
});
afterEach(async () => { await cleanup(); });
function setup(completed: boolean) {
  const job = { _id: 'job', jobCode: 'JOB-1', status: 'collecting', totalWeightKg: 20, cargoDescription: 'Vegetables', pickupPoints: [{ _id: 'stop', city: 'Colombo', completedAt: completed ? '2026-10-14' : undefined }], destination: { city: 'Kandy' } } as DeliveryJob;
  jest.mocked(useDriverJob).mockReturnValue({ job, error: null, isLoading: false, refresh: jest.fn(), setJob: jest.fn() });
}
test('transit is disabled and pickup controls are visible until collection is confirmed', async () => {
  setup(false); await render(<DriverUpdateStatusScreen />);
  expect(screen.getByText('Pickup confirmation controls')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Confirm pickup stops first' }).props.accessibilityState.disabled).toBe(true);
});
test('transit is available when every pickup is confirmed', async () => {
  setup(true); await render(<DriverUpdateStatusScreen />);
  expect(screen.getByRole('button', { name: 'Confirm Cargo in Transit' }).props.accessibilityState.disabled).toBe(false);
});
