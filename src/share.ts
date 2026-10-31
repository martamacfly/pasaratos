import * as Clipboard from 'expo-clipboard';
import { Linking, Platform, Share } from 'react-native';
import { SITE_URL } from '@/games/catalog';

/** Whether the system share sheet exists here: always on phones, only in some browsers on the web. */
export const canShareNatively = () =>
  Platform.OS !== 'web' || (typeof navigator !== 'undefined' && 'share' in navigator);

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
  return (await copy(text)) ? 'copied' : 'failed';
}

export async function copy(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
}

/** Social networks that take a text to post through a link. The text already ends with the site's link. */
export const NETWORKS = [
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: (t: string) => `https://wa.me/?text=${enc(t)}` },
  { id: 'x', name: 'X', color: '#111111', url: (t: string) => `https://twitter.com/intent/tweet?text=${enc(t)}` },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    // Facebook only takes the link; the post's text is written there.
    url: () => `https://www.facebook.com/sharer/sharer.php?u=${enc(SITE_URL)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    color: '#229ED9',
    url: (t: string) => `https://t.me/share/url?url=${enc(SITE_URL)}&text=${enc(t.replace(SITE_URL, '').trim())}`,
  },
] as const;

const enc = encodeURIComponent;

export function shareTo(network: (typeof NETWORKS)[number], text: string) {
  Linking.openURL(network.url(text)).catch(() => {});
}
