import { usePathname } from 'expo-router';

/** main: header and buttons; soft: highlights and borders; bg: screen background. */
export type GameTheme = { main: string; soft: string; bg: string };

const DEFAULT: GameTheme = { main: '#3B5BDB', soft: '#DBE4FF', bg: '#F6F4EF' };

export const GAME_THEMES: Record<string, GameTheme> = {
  sudoku: { main: '#3B5BDB', soft: '#DBE4FF', bg: '#EEF2FF' },
  palabra: { main: '#2F9E44', soft: '#D3F9D8', bg: '#EDFAEF' },
  reinas: { main: '#E8590C', soft: '#FFE8CC', bg: '#FFF4E8' },
  crucigrama: { main: '#862E9C', soft: '#F3D9FA', bg: '#FAF0FC' },
  binario: { main: '#F08C00', soft: '#FFEC99', bg: '#FFF9E3' },
  buscaminas: { main: '#495057', soft: '#DEE2E6', bg: '#F1F3F5' },
  nonograma: { main: '#0C8599', soft: '#C5F6FA', bg: '#EAFBFD' },
  sopa: { main: '#C2255C', soft: '#FFDEEB', bg: '#FFF0F6' },
  futoshiki: { main: '#1971C2', soft: '#D0EBFF', bg: '#EDF6FF' },
  calcudoku: { main: '#A61E4D', soft: '#FCC2D7', bg: '#FFF0F6' },
  camino: { main: '#2B8A3E', soft: '#C3FAE8', bg: '#ECFBF4' },
  colores: { main: '#7048E8', soft: '#E5DBFF', bg: '#F5F1FF' },
  grupos: { main: '#E67700', soft: '#FFF3BF', bg: '#FFFAE8' },
  autodefinido: { main: '#D9480F', soft: '#FFE8CC', bg: '#FFF4E8' },
  codigo: { main: '#C92A2A', soft: '#FFE3E3', bg: '#FFF5F5' },
  deslizante: { main: '#5C940D', soft: '#E9FAC8', bg: '#F6FDE9' },
  criptograma: { main: '#8D5524', soft: '#F5E6D3', bg: '#FBF6EF' },
  logros: { main: '#E67700', soft: '#FFF3BF', bg: '#FFFAE8' },
};

export const themeFor = (route: string) => GAME_THEMES[route] ?? DEFAULT;

/** Theme of the game on screen, taken from the route (e.g. "/sudoku" -> sudoku). */
export function useGameTheme(): GameTheme {
  const path = usePathname();
  return themeFor(path.split('/').filter(Boolean).pop() ?? '');
}
