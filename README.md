<p align="center">
  <img src="assets/icon.png" width="96" alt="Logo de Pasaratos" />
</p>

<h1 align="center">Pasaratos</h1>

<p align="center"><b>Pasatiempos para cada rato.</b> 17 juegos de números, palabras y lógica, con reto del día, niveles y logros.</p>

<p align="center"><a href="https://martamacfly.github.io/pasaratos/">▶ Jugar en el navegador</a></p>

---

## Juegos

| Números | Palabras | Lógica y trazos |
|---|---|---|
| Sudoku | Palabra oculta | Reinas |
| Futoshiki | Crucigrama | Buscaminas |
| Calcudoku | Sopa de letras | Nonograma |
| Binario | Grupos de 4 | Camino numerado |
| | Autodefinido | Conectar colores |
| | Criptograma | Descifrar el código |
| | | Puzzle deslizante |

Los tableros se generan al azar, y los de lógica tienen siempre una sola solución. Grupos de 4 y los refranes del Criptograma están escritos a mano.

## Funciones

- **Reto del día:** cada día, un tablero de cada juego, el mismo para todo el mundo. Lleva la cuenta de los días seguidos y se puede compartir el resultado (por ejemplo, la cuadrícula de colores de Palabra oculta).
- **Niveles:** cada dificultad tiene 20 niveles fijos que se desbloquean al completar el anterior, con botón para reiniciar el nivel.
- **Logros:** 18 medallas de bronce, plata y oro por partidas ganadas, rachas, niveles completados y retos especiales.
- **Guardado automático:** cada partida se guarda y se retoma donde se dejó, con tiempos y récords por dificultad.
- **Comodidades:** deshacer en los juegos de tablero, notas en el Sudoku, teclado físico en los juegos de palabras en el navegador.
- **Diseño adaptable:** en el móvil, una columna; en el ordenador, el tablero grande y un panel lateral con los controles. Cada juego tiene su color y sus iconos, dibujados en lugar de emojis para que se vean igual en todos los dispositivos.

## Tecnología

- [Expo](https://expo.dev) SDK 58 con React Native y TypeScript.
- [Expo Router](https://docs.expo.dev/router/introduction/) para la navegación: cada pantalla es un archivo en `src/app/`.
- `react-native-svg` para los iconos y `@react-native-async-storage/async-storage` para guardar el progreso en el dispositivo. No hay servidor ni cuentas.
- La web se exporta como sitio estático y se publica en GitHub Pages en cada push a `master` ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)).

## Cómo ejecutarlo

Necesitas [Node.js](https://nodejs.org) 20 o posterior.

```bash
npm install
npx expo start
```

Después:

- **En el móvil:** instala la app **Expo Go** (Android o iPhone) y escanea el código QR que aparece en la terminal.
- **En el navegador:** pulsa `w` en la terminal, o ejecuta `npm run web`.

Para comprobar los tipos:

```bash
npm run typecheck
```

Para generar la versión web como hace la publicación (sale en `dist/`):

```bash
npx expo export -p web
```

## Estructura

```
src/
├── app/            Pantallas (una por juego) y navegación
│   ├── index.tsx   Menú principal con el reto del día
│   └── logros.tsx  Pantalla de logros
├── games/          Lógica de cada juego: generadores, comprobaciones y contenido
│   ├── catalog.ts  Lista de juegos del menú
│   ├── grupos.ts   Partidas de Grupos de 4
│   ├── pistas.ts   Palabras y pistas de crucigrama y autodefinido
│   └── random.ts   Azar con semilla (reto del día y niveles)
├── components/     Piezas compartidas: diseño, barra de niveles, iconos, botones
├── hooks/          Cronómetro, deshacer y arrastre con el dedo
├── daily.ts        Reto del día, rachas y texto para compartir
├── levels.ts       Progreso de niveles
├── achievements.ts Logros
└── storage.ts      Guardado de partidas y estadísticas
```

### Añadir contenido

- **Partidas de Grupos de 4:** añade una entrada a `PUZZLES` en `src/games/grupos.ts`. Son 4 grupos de 4 palabras, ordenados de más fácil a más difícil. Cada partida es un nivel.
- **Palabras de crucigrama:** añade `{ word, clue }` a `PISTAS` y su pista corta a `CORTAS` en `src/games/pistas.ts`. Las palabras van en mayúsculas y sin tildes; la Ñ sí se mantiene.
- **Refranes del Criptograma:** añádelos a `REFRANES` en `src/games/criptograma.ts`.

### Añadir un juego nuevo

1. La lógica, en `src/games/<juego>.ts`. Usa `random()` y `shuffle()` de `random.ts` en lugar de `Math.random()`, para que funcionen el reto del día y los niveles.
2. La pantalla, en `src/app/<juego>.tsx`, con `GameLayout`, `LevelBar`, `useDaily` y `useAutosave`. Puedes copiar la estructura de un juego parecido.
3. Regístralo en `src/games/catalog.ts`, `src/app/_layout.tsx` (título), `src/gameTheme.ts` (colores) y `src/components/icons.tsx` (icono).
