// Every game in the app, grouped as they appear on the menu.
export type GameInfo = { id: string; href: string; name: string; desc: string };

export const SECTIONS: { title: string; games: GameInfo[] }[] = [
  {
    title: 'Números',
    games: [
      { id: 'sudoku', href: '/sudoku', name: 'Sudoku', desc: 'Rellena la cuadrícula 9×9 sin repetir números.' },
      {
        id: 'futoshiki',
        href: '/futoshiki',
        name: 'Futoshiki',
        desc: 'Números sin repetir que respetan los signos < y >.',
      },
      {
        id: 'calcudoku',
        href: '/calcudoku',
        name: 'Calcudoku',
        desc: 'Cada zona debe dar su suma, resta, producto o división.',
      },
      {
        id: 'binario',
        href: '/binario',
        name: 'Binario',
        desc: 'Soles y lunas a partes iguales, nunca tres seguidos.',
      },
    ],
  },
  {
    title: 'Palabras',
    games: [
      {
        id: 'palabra',
        href: '/palabra',
        name: 'Palabra oculta',
        desc: 'Adivina la palabra de 5 letras en 6 intentos.',
      },
      {
        id: 'crucigrama',
        href: '/crucigrama',
        name: 'Crucigrama',
        desc: 'Completa las palabras a partir de sus pistas.',
      },
      { id: 'sopa', href: '/sopa', name: 'Sopa de letras', desc: 'Encuentra todas las palabras escondidas.' },
      { id: 'grupos', href: '/grupos', name: 'Grupos de 4', desc: 'Separa 16 palabras en 4 grupos con algo en común.' },
      {
        id: 'autodefinido',
        href: '/autodefinido',
        name: 'Autodefinido',
        desc: 'Crucigrama con las pistas dentro de la cuadrícula.',
      },
      {
        id: 'criptograma',
        href: '/criptograma',
        name: 'Criptograma',
        desc: 'Descifra el refrán: cada número es una letra.',
      },
    ],
  },
  {
    title: 'Lógica y trazos',
    games: [
      { id: 'reinas', href: '/reinas', name: 'Reinas', desc: 'Una reina por fila, columna y color. Sin tocarse.' },
      { id: 'buscaminas', href: '/buscaminas', name: 'Buscaminas', desc: 'Despeja el campo sin pisar ninguna mina.' },
      {
        id: 'nonograma',
        href: '/nonograma',
        name: 'Nonograma',
        desc: 'Pinta casillas según los números y descubre el dibujo.',
      },
      {
        id: 'camino',
        href: '/camino',
        name: 'Camino numerado',
        desc: 'Una sola línea por todas las casillas, con los números en orden.',
      },
      {
        id: 'colores',
        href: '/colores',
        name: 'Conectar colores',
        desc: 'Une las parejas de colores llenando el tablero.',
      },
      {
        id: 'codigo',
        href: '/codigo',
        name: 'Descifrar el código',
        desc: 'Adivina la combinación secreta de colores.',
      },
      {
        id: 'deslizante',
        href: '/deslizante',
        name: 'Puzzle deslizante',
        desc: 'Ordena los números deslizando las fichas.',
      },
    ],
  },
];

export const ALL_GAMES = SECTIONS.flatMap((s) => s.games);

export const gameName = (id: string) => ALL_GAMES.find((g) => g.id === id)?.name ?? id;

// Games that can be lost show "won of played"; the rest only count solved puzzles.
export const CAN_LOSE = new Set<string>(['palabra', 'buscaminas', 'grupos', 'codigo']);

export const SITE_URL = 'https://martamacfly.github.io/pasaratos/';
