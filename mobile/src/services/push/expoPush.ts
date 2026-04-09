import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from '../ApiService';

const EXPO_PUSH_TOKEN_KEY = 'biztrack_expo_push_token_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function ensurePushPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return Boolean(
    req.granted ||
      req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
  );
}

export async function registerAndSyncPushTokenWithBackend(): Promise<
  string | null
> {
  const ok = await ensurePushPermissions();
  if (!ok) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig
      ?.projectId;

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResult.data;
  if (!token) return null;

  await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

  try {
    await apiService.post('/notifications/push/register', {
      expo_push_token: token,
      platform: Platform.OS,
    });
  } catch {
    return token;
  }
  return token;
}

export async function unregisterStoredPushTokenFromBackend(): Promise<void> {
  const token = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
  if (!token) return;
  try {
    await apiService.delete('/notifications/push/register', {
      data: { expo_push_token: token },
    });
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
}
