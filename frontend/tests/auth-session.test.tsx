import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { Button, DeviceEventEmitter, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/auth-context';
import { readSession, writeSession } from '../src/services/session-store';
import { setApiToken } from '../src/services/api';

jest.mock('../src/services/session-store', () => ({ readSession: jest.fn(), writeSession: jest.fn(async () => {}) }));
jest.mock('../src/services/api', () => ({ api: { get: jest.fn() }, setApiToken: jest.fn() }));
jest.mock('../src/services/offline-driver', () => ({ setOfflineOwner: jest.fn() }));
jest.mock('../src/services/background-location', () => ({ stopBackgroundSharing: jest.fn(async () => {}) }));
jest.mock('../src/services/auth-service', () => ({ loginUser: jest.fn(async () => ({ token: 'token', user: { id: 'buyer', role: 'buyer' } })), registerUser: jest.fn() }));

function SessionView() {
  const { isRestoring, isAuthenticated, login } = useAuth();
  return <View><Text>{isRestoring ? 'Starting' : isAuthenticated ? 'Signed in' : 'Login required'}</Text><Button title="Log in" onPress={() => void login({ email: 'buyer@example.com', password: 'password' })} /></View>;
}

afterEach(async () => { await cleanup(); });

test('requires fresh login after reopening and does not persist the login response', async () => {
  jest.mocked(readSession).mockResolvedValue({ token: 'old-token', user: { id: 'old-buyer', role: 'buyer' } } as Awaited<ReturnType<typeof readSession>>);
  const first = await render(<AuthProvider><SessionView /></AuthProvider>);
  expect(await screen.findByText('Login required')).toBeTruthy();
  expect(readSession).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(await screen.findByText('Signed in')).toBeTruthy();
  expect(writeSession).toHaveBeenCalledWith(null);
  expect(jest.mocked(writeSession).mock.calls.every(([session]) => session === null)).toBe(true);
  await first.unmount();
  await render(<AuthProvider><SessionView /></AuthProvider>);
  expect(await screen.findByText('Login required')).toBeTruthy();
});

test('native photo-screen lifecycle events preserve the current login and API token', async () => {
  await render(<AuthProvider><SessionView /></AuthProvider>);
  await screen.findByText('Login required');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByText('Signed in');
  await act(async () => {
    for (const state of ['inactive', 'background', 'active', 'background', 'active']) {
      DeviceEventEmitter.emit('appStateDidChange', { app_state: state });
    }
  });
  expect(screen.getByText('Signed in')).toBeTruthy();
  expect(setApiToken).toHaveBeenLastCalledWith('token');
});
