import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Reminders are local notifications, so they only exist in the phone app, not on the web. */
export const REMINDERS_AVAILABLE = Platform.OS !== 'web';

if (REMINDERS_AVAILABLE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Replaces the daily challenge reminder with one at `hour` o'clock, or removes it (null).
 * Resolves to false if the player didn't allow notifications.
 */
export async function scheduleReminder(hour: number | null): Promise<boolean> {
  if (!REMINDERS_AVAILABLE) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour === null) return true;
  // On Android 13+ the permission prompt only shows once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Reto del día',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { granted } = (await Notifications.getPermissionsAsync()).granted
    ? { granted: true }
    : await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Pasaratos', body: '¡Tu reto del día te espera!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: 'daily' },
  });
  return true;
}
