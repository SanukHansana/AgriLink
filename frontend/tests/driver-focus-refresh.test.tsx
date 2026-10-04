import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useDriverOverview } from '../src/hooks/use-driver-overview';
import { getDriverJobs } from '../src/services/driver-service';
let mockFocus: (() => void | (() => void)) | undefined;
jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => void | (() => void)) => {
  const React = require('react');
  mockFocus = callback;
  React.useEffect(callback, [callback]);
} }));
jest.mock('../src/services/api', () => ({ getApiErrorMessage: () => 'Load failed' }));
jest.mock('../src/services/driver-service', () => ({ getDriverProfile: jest.fn(async () => null), getDriverVehicles: jest.fn(async () => ({ vehicles: [] })), getDriverJobs: jest.fn() }));
afterEach(async () => { await cleanup(); });
function View() { const state = useDriverOverview(); return <Text>{state.isLoading ? 'Loading' : state.myJobs[0]?.status ?? 'Empty'}</Text>; }
test('returning to driver screens replaces cached transit status with delivered status', async () => {
  let status = 'inTransit';
  jest.mocked(getDriverJobs).mockImplementation(async ({ scope } = {}) => ({ count: scope === 'mine' ? 1 : 0, jobs: scope === 'mine' ? [{ status }] : [] }) as Awaited<ReturnType<typeof getDriverJobs>>);
  await render(<View />);
  await screen.findByText('inTransit');
  status = 'delivered';
  await act(async () => { mockFocus?.(); });
  expect(await screen.findByText('delivered')).toBeTruthy();
});
