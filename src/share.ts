import { Platform, Share } from 'react-native';

/**
 * Shares text with the system share sheet. On the web, browsers without it (most desktops)
 * copy the text to the clipboard instead. Resolves to what happened, for the button's feedback.
 */
export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (Platform.OS !== 'web') {
    try {
      await Share.share({ message: text });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
  const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ text });
      return 'shared';
    } catch {
      // Cancelled by the user or not allowed: fall back to copying.
    }
  }
  try {
    await nav.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
