import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api, getApiToken } from '@/services/api';
import { getLanguage } from '@/i18n/language';
let registeredToken: string | null = null;
let registrationGeneration = 0;
export function supportsPhonePush() {
  return Platform.OS !== 'web' && Device.isDevice && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
// Load lazily so Expo Go never initializes unsupported remote notification APIs.
export async function notificationApi(): Promise<typeof import('expo-notifications')> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications');
}
export async function registerPhonePush(prompt = false) {
  const generation = registrationGeneration;
  const authToken = getApiToken();
  if (!supportsPhonePush()) throw new Error('Phone notifications need an AgriLink development or production build on a real phone. Expo Go and web use the in-app inbox.');
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Link this app to an EAS project and rebuild to enable phone notifications.');
  const notifications = await notificationApi();
  notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('agrilink', { name: 'AgriLink alerts', importance: notifications.AndroidImportance.HIGH, lightColor: '#008A36' });
  let permission = await notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && prompt && permission.canAskAgain) permission = await notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    if (prompt) throw new Error('Allow notifications in your phone settings to receive AgriLink alerts.');
    return false;
  }
  const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
  if (generation !== registrationGeneration || !authToken || authToken !== getApiToken()) return false;
  await api.post('/notifications/devices', { token, language: getLanguage() });
  if (generation !== registrationGeneration || authToken !== getApiToken()) {
    await api.delete('/notifications/devices', { data: { token }, headers: { Authorization: `Bearer ${authToken}` } }).catch(() => {});
    return false;
  }
  registeredToken = token;
  return true;
}
export async function unregisterPhonePush() {
  registrationGeneration += 1;
  const token = registeredToken;
  registeredToken = null;
  if (token) await api.delete('/notifications/devices', { data: { token } });
}
