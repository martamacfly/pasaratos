// Drawn icons, so the menu and game pieces look the same on every phone (emoji vary by system).
// Every glyph is drawn in a 100×100 box.
import type { ReactNode } from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

type GlyphProps = { ink: string };

export function CrownGlyph({ ink }: GlyphProps) {
  return (
    <G>
      <Path d="M18 76 L14 34 L34 50 L50 24 L66 50 L86 34 L82 76 Z" fill={ink} stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <Circle cx={14} cy={28} r={7} fill={ink} />
      <Circle cx={50} cy={17} r={7} fill={ink} />
      <Circle cx={86} cy={28} r={7} fill={ink} />
    </G>
  );
}

export function SunGlyph({ ink }: GlyphProps) {
  return (
    <G>
      <Circle cx={50} cy={50} r={20} fill={ink} />
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k * Math.PI) / 4;
        return (
          <Line
            key={k}
            x1={50 + Math.cos(a) * 30}
            y1={50 + Math.sin(a) * 30}
            x2={50 + Math.cos(a) * 42}
            y2={50 + Math.sin(a) * 42}
            stroke={ink}
            strokeWidth={8}
            strokeLinecap="round"
          />
        );
      })}
    </G>
  );
}

export function MoonGlyph({ ink }: GlyphProps) {
  return <Path d="M62 14 A38 38 0 1 0 86 64 A30 30 0 1 1 62 14 Z" fill={ink} />;
}

export function MineGlyph({ ink }: GlyphProps) {
  return (
    <G>
      {Array.from({ length: 4 }, (_, k) => {
        const a = (k * Math.PI) / 4;
        return (
          <Line
            key={k}
            x1={50 - Math.cos(a) * 40}
            y1={50 - Math.sin(a) * 40}
            x2={50 + Math.cos(a) * 40}
            y2={50 + Math.sin(a) * 40}
            stroke={ink}
            strokeWidth={8}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={50} cy={50} r={27} fill={ink} />
      <Circle cx={41} cy={41} r={7} fill="#fff" opacity={0.7} />
    </G>
  );
}

export function FlagGlyph({ ink }: GlyphProps) {
  return (
    <G>
      <Line x1={32} y1={14} x2={32} y2={86} stroke="#343A40" strokeWidth={8} strokeLinecap="round" />
      <Path d="M36 16 L80 34 L36 52 Z" fill={ink} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <Line x1={18} y1={86} x2={50} y2={86} stroke="#343A40" strokeWidth={8} strokeLinecap="round" />
    </G>
  );
}

export function CheckGlyph({ ink }: GlyphProps) {
  return <Path d="M20 52 L42 74 L82 28" fill="none" stroke={ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />;
}

export function CrossGlyph({ ink }: GlyphProps) {
  return <Path d="M26 26 L74 74 M74 26 L26 74" fill="none" stroke={ink} strokeWidth={14} strokeLinecap="round" />;
}

/** A glyph on its own, sized in px. */
export function Glyph({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {children}
    </Svg>
  );
}

// ---- Menu icons: one per game, a glyph on a pastel rounded tile.

const grid = (cells: [number, number][], n: number, ink: string, soft: string, filled: (r: number, c: number) => boolean) => {
  const size = 60 / n;
  return cells.map(([r, c]) => (
    <Rect
      key={`${r}-${c}`}
      x={20 + c * size + 2}
      y={20 + r * size + 2}
      width={size - 4}
      height={size - 4}
      rx={3}
      fill={filled(r, c) ? ink : soft}
    />
  ));
};
const allCells = (n: number) => Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n] as [number, number]);

const GAME_ICONS: Record<string, { bg: string; draw: () => ReactNode }> = {
  sudoku: { bg: '#DBE4FF', draw: () => grid(allCells(3), 3, '#3B5BDB', '#BAC8FF', (r, c) => r === c) },
  palabra: {
    bg: '#D3F9D8',
    draw: () => (
      <G>
        {[0, 1, 2].map((k) => (
          <Rect key={k} x={14 + k * 25} y={34} width={22} height={32} rx={4} fill={['#2F9E44', '#F59F00', '#ADB5BD'][k]} />
        ))}
      </G>
    ),
  },
  reinas: { bg: '#FFE8CC', draw: () => <G transform="translate(18 20) scale(0.64)"><CrownGlyph ink="#E8590C" /></G> },
  crucigrama: {
    bg: '#F3D9FA',
    draw: () => grid(allCells(4), 4, '#862E9C', '#FFFFFF', (r, c) => (r === 0 && c === 3) || (r === 2 && c === 1) || (r === 3 && c === 3)),
  },
  binario: {
    bg: '#FFF3BF',
    draw: () => (
      <G>
        <G transform="translate(10 18) scale(0.42)"><SunGlyph ink="#F08C00" /></G>
        <G transform="translate(50 40) scale(0.42)"><MoonGlyph ink="#5F3DC4" /></G>
      </G>
    ),
  },
  buscaminas: { bg: '#E9ECEF', draw: () => <G transform="translate(20 20) scale(0.6)"><MineGlyph ink="#343A40" /></G> },
  nonograma: {
    bg: '#C5F6FA',
    // A small heart in pixels.
    draw: () => grid(allCells(5), 5, '#0C8599', '#FFFFFF', (r, c) => ['01010', '11111', '11111', '01110', '00100'][r][c] === '1'),
  },
  sopa: {
    bg: '#FFDEEB',
    draw: () => (
      <G>
        <Circle cx={44} cy={44} r={20} fill="#FFFFFF" stroke="#C2255C" strokeWidth={9} />
        <Line x1={59} y1={59} x2={78} y2={78} stroke="#C2255C" strokeWidth={11} strokeLinecap="round" />
      </G>
    ),
  },
  futoshiki: {
    bg: '#E7F5FF',
    draw: () => (
      <G>
        <Rect x={14} y={32} width={28} height={36} rx={6} fill="#FFFFFF" stroke="#1971C2" strokeWidth={4} />
        <Rect x={58} y={32} width={28} height={36} rx={6} fill="#FFFFFF" stroke="#1971C2" strokeWidth={4} />
        <Path d="M56 40 L45 50 L56 60" fill="none" stroke="#E8590C" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.5 0)" />
      </G>
    ),
  },
  calcudoku: {
    bg: '#FFF0F6',
    draw: () => (
      <G stroke="#A61E4D" strokeWidth={7} strokeLinecap="round">
        <Line x1={22} y1={34} x2={42} y2={34} />
        <Line x1={32} y1={24} x2={32} y2={44} />
        <Line x1={58} y1={34} x2={78} y2={34} />
        <Line x1={24} y1={58} x2={40} y2={74} />
        <Line x1={40} y1={58} x2={24} y2={74} />
        <Line x1={58} y1={66} x2={78} y2={66} />
        <Circle cx={68} cy={56} r={3.5} fill="#A61E4D" strokeWidth={0} />
        <Circle cx={68} cy={76} r={3.5} fill="#A61E4D" strokeWidth={0} />
      </G>
    ),
  },
  camino: {
    bg: '#EBFBEE',
    draw: () => (
      <G>
        <Path d="M26 26 L74 26 L74 50 L26 50 L26 74 L74 74" fill="none" stroke="#2F9E44" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={26} cy={26} r={10} fill="#212529" />
        <Circle cx={74} cy={74} r={10} fill="#212529" />
      </G>
    ),
  },
  grupos: {
    bg: '#FFF9DB',
    // Four rows in the four group colours.
    draw: () =>
      allCells(4).map(([r, c]) => (
        <Rect key={`${r}-${c}`} x={22 + c * 15} y={22 + r * 15} width={11} height={11} rx={3} fill={['#FCC419', '#51CF66', '#339AF0', '#9775FA'][r]} />
      )),
  },
  autodefinido: {
    bg: '#FFF4E6',
    draw: () => (
      <G>
        {grid(allCells(3), 3, '#FAB005', '#FFFFFF', (r, c) => (r === 0 && c === 0) || (r === 2 && c === 0))}
        <Path d="M36 30 L44 36 L36 42 Z" fill="#E8590C" />
        <Path d="M25 64 L31 72 L37 64 Z" fill="#E8590C" />
      </G>
    ),
  },
  colores: {
    bg: '#F8F0FC',
    draw: () => (
      <G strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M26 26 L26 74 L50 74" stroke="#E03131" />
        <Path d="M50 26 L74 26 L74 74" stroke="#1971C2" />
        <Circle cx={26} cy={26} r={9} fill="#E03131" strokeWidth={0} />
        <Circle cx={50} cy={74} r={9} fill="#E03131" strokeWidth={0} />
        <Circle cx={50} cy={26} r={9} fill="#1971C2" strokeWidth={0} />
        <Circle cx={74} cy={74} r={9} fill="#1971C2" strokeWidth={0} />
      </G>
    ),
  },
};

export function GameIcon({ id, size, tile = true }: { id: string; size: number; tile?: boolean }) {
  const icon = GAME_ICONS[id];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {tile && <Rect width={100} height={100} rx={22} fill={icon.bg} />}
      {icon.draw()}
    </Svg>
  );
}
