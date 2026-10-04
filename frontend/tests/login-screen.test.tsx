import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import LoginScreen from '../src/app/(auth)/login';
import { useAuth } from '../src/contexts/auth-context';

jest.mock('expo-router', () => ({ Link: ({ children }: { children: ReactNode }) => children }));
jest.mock('../src/contexts/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../src/services/api', () => ({ getApiErrorMessage: () => 'Unable to sign in. Please try again.' }));
const login = jest.fn<() => Promise<void>>();
beforeEach(() => {
  login.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, isRestoring: false, isAuthenticated: false, login, register: async () => {}, logout: jest.fn(), refreshUser: async () => {} });
});
afterEach(async () => { await cleanup(); });

test('password visibility can be toggled without changing its value', async () => {
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('Password'), 'my-password');
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText('Password').props.value).toBe('my-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
});

test('invalid email displays guidance before sending a login request', async () => {
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email address'), 'farmer');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'my-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(screen.getByText('Enter a valid email address, such as name@example.com.')).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
});

test('valid credentials are submitted and failed login stays visible', async () => {
  login.mockRejectedValue(new Error('Network unavailable'));
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('Email address'), ' farmer@example.com ');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'my-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(login).toHaveBeenCalledWith({ email: 'farmer@example.com', password: 'my-password' });
  expect(await screen.findByText('Unable to sign in. Please try again.')).toBeTruthy();
});
