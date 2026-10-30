import { View } from 'react-native';

/** Thick rounded bars joining the centres of consecutive cells of `path`. */
export function PathLines({ path, n, cell, color }: { path: number[]; n: number; cell: number; color: string }) {
  const thick = cell * 0.36;
  return (
    <>
      {path.map((a, k) => {
        const b = path[k + 1];
        if (b === undefined) return null;
        const [r1, c1] = [Math.floor(a / n), a % n];
        const [r2, c2] = [Math.floor(b / n), b % n];
        const top = Math.min(r1, r2) * cell + (cell - thick) / 2;
        const left = Math.min(c1, c2) * cell + (cell - thick) / 2;
        return (
          <View
            key={k}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top,
              left,
              width: r1 === r2 ? cell + thick : thick,
              height: r1 === r2 ? thick : cell + thick,
              borderRadius: thick / 2,
              backgroundColor: color,
            }}
          />
        );
      })}
    </>
  );
}
