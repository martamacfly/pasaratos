import * as Haptics from 'expo-haptics';
import { getSettings } from '@/settings';

// Vibration feedback, when the setting is on. On the web it only works where the browser can vibrate.

/** A light tick, for buttons and keys. */
export function tap() {
  if (getSettings().haptics) Haptics.selectionAsync().catch(() => {});
}

/** A game won or lost. */
export function buzz(won: boolean) {
  if (!getSettings().haptics) return;
  Haptics.notificationAsync(
    won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}
