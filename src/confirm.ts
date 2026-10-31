import { Alert, Platform } from 'react-native';

/** Asks before doing something that can't be undone; runs `action` only if the player agrees. */
export function confirm(title: string, message: string, action: () => void, okLabel = 'Sí') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) action();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: action },
  ]);
}
