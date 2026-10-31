import { Pressable } from 'react-native';
import { Glyph, StarGlyph } from '@/components/icons';
import { tap } from '@/haptics';
import { toggleFavorite, useFavorites } from '@/favorites';

/** Star that marks a game as favourite: filled when it is one. */
export function FavoriteStar({ game, size = 26, color }: { game: string; size?: number; color: string }) {
  const on = useFavorites().includes(game);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      accessibilityState={{ selected: on }}
      hitSlop={10}
      onPress={() => {
        tap();
        toggleFavorite(game);
      }}
      style={({ pressed }) => [{ padding: 4 }, pressed && { transform: [{ scale: 0.85 }] }]}
    >
      <Glyph size={size}>
        <StarGlyph ink={color} filled={on} />
      </Glyph>
    </Pressable>
  );
}
