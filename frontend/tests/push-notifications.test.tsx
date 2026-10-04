import { expect, jest, test } from '@jest/globals';
import { registerPhonePush, supportsPhonePush } from '../src/services/push-notifications';
import { Platform } from 'react-native';
import { api } from '../src/services/api';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'storeClient', easConfig: { projectId: 'project-id' } }, ExecutionEnvironment: { StoreClient: 'storeClient', Bare: 'bare' } }));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('../src/services/api', () => ({ api: { post: jest.fn(async () => ({})) }, getApiToken: () => 'token' }));
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => ({})), getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })), getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExpoPushToken[abcdefghij123]' })), AndroidImportance: { HIGH: 4 } }));
test('Expo Go skips push registration without invoking unsupported native APIs', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  expect(supportsPhonePush()).toBe(false);
  await expect(registerPhonePush(true)).rejects.toThrow('development or production build');
  expect(api.post).not.toHaveBeenCalled();
});
test('native build registers the granted device token with the backend', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.replaceProperty(Constants, 'executionEnvironment', ExecutionEnvironment.Bare);
  expect(await registerPhonePush()).toBe(true);
  expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
  expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-id' });
  expect(api.post).toHaveBeenCalledWith('/notifications/devices', { token: 'ExpoPushToken[abcdefghij123]', language: 'en' });
});
