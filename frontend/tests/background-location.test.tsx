import { expect, jest, test } from '@jest/globals';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { backgroundSharingJob, startBackgroundSharing, stopBackgroundSharing, supportsBackgroundLocation } from '../src/services/background-location';

jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'storeClient' }, ExecutionEnvironment: { StoreClient: 'storeClient', Bare: 'bare' } }));
jest.mock('expo-location', () => ({ hasStartedLocationUpdatesAsync: jest.fn(async () => true), stopLocationUpdatesAsync: jest.fn(async () => {}), requestForegroundPermissionsAsync: jest.fn(), requestBackgroundPermissionsAsync: jest.fn() }));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn(), isAvailableAsync: jest.fn(async () => true) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), deleteItemAsync: jest.fn(async () => {}) }));
jest.mock('../src/services/api', () => ({ api: {}, getApiToken: jest.fn() }));
jest.mock('../src/services/offline-driver', () => ({ operationId: jest.fn() }));

test('Expo Go startup clears stored tracking without calling unsupported location APIs', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  expect(supportsBackgroundLocation()).toBe(false);
  await stopBackgroundSharing();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  expect(Location.hasStartedLocationUpdatesAsync).not.toHaveBeenCalled();
  expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  expect(await backgroundSharingJob()).toBeNull();
  await expect(startBackgroundSharing('job')).rejects.toThrow('development or production build');
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
});

test('native development builds still stop an active background task', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.replaceProperty(Constants, 'executionEnvironment', ExecutionEnvironment.Bare);
  expect(supportsBackgroundLocation()).toBe(true);
  await stopBackgroundSharing();
  expect(Location.hasStartedLocationUpdatesAsync).toHaveBeenCalled();
  expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
});

test('browser cleanup avoids native storage and location APIs', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  await stopBackgroundSharing();
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  expect(Location.hasStartedLocationUpdatesAsync).not.toHaveBeenCalled();
});
