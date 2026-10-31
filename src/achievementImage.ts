import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import type { Achievement } from '@/achievements';
import { CARD_COLORS, TIER_INK, TIER_LABEL } from '@/components/AchievementCard';
import { FONTS } from '@/components/AppText';
import { SITE_URL } from '@/games/catalog';

// Shares an achievement as a picture. Phones take a snapshot of the card on screen (AchievementCard);
// the web draws the same design on a canvas, since a snapshot of the page isn't reliable there.

const SIZE = 1080;
const FILE_NAME = 'pasaratos-logro.png';

/** Whether the picture can be handed to other apps here; otherwise the web downloads it. */
export function canShareImage() {
  if (Platform.OS !== 'web') return true;
  const probe = typeof File !== 'undefined' ? new File([''], FILE_NAME, { type: 'image/png' }) : null;
  return !!probe && !!navigator.canShare?.({ files: [probe] });
}

export async function shareAchievementImage(
  a: Achievement,
  card: RefObject<ComponentRef<typeof View> | null>,
): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    if (Platform.OS !== 'web') {
      const uri = await captureRef(card, { format: 'png', quality: 1, width: SIZE, height: SIZE, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir logro' });
      return 'shared';
    }
    const blob = await drawAchievement(a);
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

/** The card of AchievementCard, drawn on a 1080 px canvas. */
async function drawAchievement(a: Achievement): Promise<Blob> {
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
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(64, FONTS.black);
  ctx.fillText('Pasaratos', 238, 148);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(34, FONTS.semibold);
  ctx.fillText('Pasatiempos para cada rato', 238, 192);

  // Medal: the paths of MedalGlyph, scaled from its 100×100 box.
  ctx.save();
  ctx.translate(340, 230);
  ctx.scale(4, 4);
  ctx.fillStyle = '#E03131';
  ctx.fill(new Path2D('M30 6 L44 40 L36 44 L22 10 Z'));
  ctx.fillStyle = '#1971C2';
  ctx.fill(new Path2D('M70 6 L56 40 L64 44 L78 10 Z'));
  ctx.fillStyle = TIER_INK[a.tier];
  ctx.beginPath();
  ctx.arc(50, 64, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(50, 64, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill(new Path2D('M50 50 L54 59 L64 60 L57 67 L59 77 L50 72 L41 77 L43 67 L36 60 L46 59 Z'));
  ctx.restore();

  // Texts, centred.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(38, FONTS.black);
  ctx.letterSpacing = '6px';
  ctx.fillText('¡LOGRO DESBLOQUEADO!', SIZE / 2, 700);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff';
  ctx.font = font(88, FONTS.black);
  ctx.fillText(a.title, SIZE / 2, 800);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = font(40, FONTS.semibold);
  wrap(ctx, `${a.desc} · ${TIER_LABEL[a.tier]}`, SIZE - 160).forEach((line, k) =>
    ctx.fillText(line, SIZE / 2, 866 + k * 50),
  );
  ctx.font = font(30, FONTS.bold);
  ctx.fillText(SITE_URL.replace('https://', ''), SIZE / 2, SIZE - 56);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png'));
}
