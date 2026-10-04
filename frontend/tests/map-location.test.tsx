import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { LocationFields } from '../src/components/location-fields';
import { googleMapsDirections } from '../src/services/driver-directions';
import { readMapMessage } from '../src/services/map-picker';

jest.mock('../src/components/map-canvas', () => {
  const { Pressable, Text } = require('react-native');
  return { MapCanvas: ({ onSelect, onReady, interactive = true }: { interactive?: boolean; onSelect: (pin: { latitude: number; longitude: number }) => void; onReady: () => void }) => !interactive ? <Text>Selected map preview</Text> : <Pressable accessibilityRole="button" onPress={() => { onReady(); onSelect({ latitude: 7.2906, longitude: 80.6337 }); }}><Text>Tap test map pin</Text></Pressable> };
});
afterEach(async () => { await cleanup(); });

test('manual map selection updates coordinates only after confirmation', async () => {
  const changed = jest.fn();
  const view = await render(<LocationFields value={{}} onChange={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose location on map' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Tap test map pin' }));
  expect(changed).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Use selected location' }));
  expect(changed).toHaveBeenCalledWith({ latitude: 7.2906, longitude: 80.6337 });
  await view.rerender(<LocationFields value={{ latitude: 7.2906, longitude: 80.6337 }} onChange={changed} />);
  expect(screen.getByText('✓ Location selected')).toBeTruthy();
  expect(screen.queryByLabelText('Latitude')).toBeNull();
  expect(screen.queryByLabelText('Longitude')).toBeNull();
});

test('cancelling a map selection preserves the saved location', async () => {
  const changed = jest.fn();
  await render(<LocationFields value={{ latitude: 6.9, longitude: 79.8 }} onChange={changed} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose location on map' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Tap test map pin' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel map selection' }));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByText('✓ Location selected')).toBeTruthy();
});

test('embedded map messages reject malformed and out-of-range coordinates', () => {
  expect(readMapMessage('invalid')).toBeNull();
  expect(readMapMessage({ channel: 'other', type: 'pin', latitude: 7, longitude: 80 })).toBeNull();
  expect(readMapMessage({ channel: 'agrilink-map', type: 'pin', latitude: 100, longitude: 80 })).toBeNull();
  expect(readMapMessage({ channel: 'agrilink-map', type: 'pin', latitude: '7', longitude: 80 })).toBeNull();
  expect(readMapMessage({ channel: 'agrilink-map', type: 'pin', latitude: 7, longitude: 80 })).toEqual({ type: 'pin', pin: { latitude: 7, longitude: 80 } });
});

test('Google Maps receives pickup before drop-off and requests navigation', () => {
  const route = googleMapsDirections([{ latitude: 7.1, longitude: 80.1 }, { latitude: 7.2, longitude: 80.2 }]);
  const url = new URL(route.url);
  expect(url.searchParams.get('waypoints')).toBe('7.1,80.1');
  expect(url.searchParams.get('destination')).toBe('7.2,80.2');
  expect(url.searchParams.get('dir_action')).toBe('navigate');
  expect(route.stopCount).toBe(2);
  expect(() => googleMapsDirections([])).toThrow('no remaining stops');
});

test('larger delivery jobs use a mobile-compatible segment with encoded addresses', () => {
  const stops = Array.from({ length: 5 }, (_, index) => ({ addressLine: `Farm & Road ${index}`, city: 'Kandy', district: 'Kandy' }));
  const route = googleMapsDirections(stops);
  expect(route.stopCount).toBe(4);
  expect(new URL(route.url).searchParams.get('destination')).toBe('Farm & Road 3, Kandy, Kandy, Sri Lanka');
  expect(new URL(route.url).searchParams.get('waypoints')?.split('|')).toHaveLength(3);
});
