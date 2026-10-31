import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { FONTS } from '@/components/AppText';
import { BADGE_ID, BADGE_SIZE, CARD_COLORS, type ShareCardData } from '@/components/ShareCard';
import { SITE_URL } from '@/games/catalog';

// Shares a ShareCard as a picture. Phones take a snapshot of the card on screen and open the system
// share sheet, where the player picks the social network. The web draws the same design on a canvas
// (a snapshot of the page isn't reliable there), copying the badge's drawing from the card on screen.

const SIZE = 1080;
const FILE_NAME = 'pasaratos.png';

/** Whether the picture can be handed to other apps here; otherwise the web downloads it. */
export function canShareImage() {
  if (Platform.OS !== 'web') return true;
  const probe = typeof File !== 'undefined' ? new File([''], FILE_NAME, { type: 'image/png' }) : null;
  return !!probe && !!navigator.canShare?.({ files: [probe] });
}

export async function shareCardImage(
  card: ShareCardData,
  view: RefObject<ComponentRef<typeof View> | null>,
): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    if (Platform.OS !== 'web') {
      const uri = await captureRef(view, { format: 'png', quality: 1, width: SIZE, height: SIZE, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir en…' });
      return 'shared';
    }
    const blob = await drawCard(card);
    const file = new File([blob], FILE_NAME, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: SITE_URL });
      return 'shared';
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = FILE_NAME;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** The badge drawn on the card on screen, as an image. */
async function badgeImage() {
  const svg = document.getElementById(BADGE_ID)?.querySelector('svg');
  if (!svg) return null;
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(BADGE_SIZE));
  copy.setAttribute('height', String(BADGE_SIZE));
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lines of `text` that fit in `width` at the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return [...lines, line];
}

/** The ShareCard design on a 1080 px canvas. */
async function drawCard(card: ShareCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const font = (px: number, family: string) => `${px}px ${family}, sans-serif`;
  await Promise.all(
    [FONTS.black, FONTS.bold, FONTS.semibold].map((f) => document.fonts?.load(font(40, f)).catch(() => {})),
  );

  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, CARD_COLORS.from);
  bg.addColorStop(1, CARD_COLORS.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Logo and name.
  const logo = await loadImage(Asset.fromModule(require('../assets/icon.png')).uri);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(80, 80, 130, 130, 30);
  ctx.clip();
  ctx.drawImage(logo, 80, 80, 130, 130);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = font(64, FONTS.black);
  ctx.fillText('Pasaratos', 238, 148);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(34, FONTS.semibold);
  ctx.fillText('Pasatiempos para cada rato', 238, 192);

  const badge = await badgeImage();
  if (badge) ctx.drawImage(badge, (SIZE - BADGE_SIZE) / 2, 270, BADGE_SIZE, BADGE_SIZE);

  // Texts, centred; the title shrinks if it is too long for one line.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(38, FONTS.black);
  ctx.letterSpacing = '6px';
  ctx.fillText(card.kicker, SIZE / 2, 725);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff';
  let titleSize = 80;
  do ctx.font = font(titleSize, FONTS.black);
  while (ctx.measureText(card.title).width > SIZE - 140 && (titleSize -= 4) > 40);
  ctx.fillText(card.title, SIZE / 2, 820);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(40, FONTS.semibold);
  wrap(ctx, card.subtitle, SIZE - 160).forEach((line, k) => ctx.fillText(line, SIZE / 2, 885 + k * 50));
  ctx.font = font(30, FONTS.bold);
  ctx.fillText(SITE_URL.replace('https://', ''), SIZE / 2, SIZE - 56);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png'));
}
