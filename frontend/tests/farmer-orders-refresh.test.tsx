import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useFarmerOrders } from '../src/hooks/use-farmer-orders';
import { getFarmerOrders } from '../src/services/farmer-service';
let mockFocus: (() => void | (() => void)) | undefined;
jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => void | (() => void)) => { const React = require('react'); mockFocus = callback; React.useEffect(callback, [callback]); } }));
jest.mock('../src/services/api', () => ({ getApiErrorMessage: () => 'Load failed' }));
jest.mock('../src/services/farmer-service', () => ({ getFarmerOrders: jest.fn() }));
afterEach(async () => { await cleanup(); });
function View() { const state = useFarmerOrders(); return <Text>{state.orders[0]?.paymentStatus ?? 'Empty'}</Text>; }
test('returning to farmer orders loads the paid order instead of the old list', async () => {
  jest.mocked(getFarmerOrders).mockResolvedValueOnce({ count: 0, orders: [] }).mockResolvedValueOnce({ count: 1, orders: [{ _id: 'order', paymentStatus: 'paid' }] } as Awaited<ReturnType<typeof getFarmerOrders>>);
  await render(<View />);
  let stop: void | (() => void);
  await act(async () => { stop = mockFocus?.(); });
  try { expect(await screen.findByText('paid')).toBeTruthy(); } finally { stop!?.(); }
});
