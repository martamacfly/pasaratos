import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HomeButton } from '@/components/HomeButton';
import { themeFor } from '@/gameTheme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        // Each game gets a header in its own colour and a soft tint of it as background.
        screenOptions={({ route }) => {
          const theme = themeFor(route.name);
          return {
            headerStyle: { backgroundColor: theme.main },
            headerShadowVisible: false,
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '800', fontSize: 20 },
            contentStyle: { backgroundColor: theme.bg },
            // Always shown, so a game opened from a link or after a reload can still get back to the menu.
            headerLeft: () => <HomeButton />,
            headerBackVisible: false,
          };
        }}
      >
        <Stack.Screen
          name="index"
          // The menu draws its own header with the logo.
          options={{ title: 'Pasaratos', headerShown: false }}
        />
        <Stack.Screen name="sudoku" options={{ title: 'Sudoku' }} />
        <Stack.Screen name="palabra" options={{ title: 'Palabra oculta' }} />
        <Stack.Screen name="reinas" options={{ title: 'Reinas' }} />
        <Stack.Screen name="crucigrama" options={{ title: 'Crucigrama' }} />
        <Stack.Screen name="binario" options={{ title: 'Binario' }} />
        <Stack.Screen name="buscaminas" options={{ title: 'Buscaminas' }} />
        <Stack.Screen name="nonograma" options={{ title: 'Nonograma' }} />
        <Stack.Screen name="sopa" options={{ title: 'Sopa de letras' }} />
        <Stack.Screen name="futoshiki" options={{ title: 'Futoshiki' }} />
        <Stack.Screen name="calcudoku" options={{ title: 'Calcudoku' }} />
        <Stack.Screen name="camino" options={{ title: 'Camino numerado' }} />
        <Stack.Screen name="colores" options={{ title: 'Conectar colores' }} />
        <Stack.Screen name="grupos" options={{ title: 'Grupos de 4' }} />
        <Stack.Screen name="autodefinido" options={{ title: 'Autodefinido' }} />
        <Stack.Screen name="codigo" options={{ title: 'Descifrar el código' }} />
        <Stack.Screen name="deslizante" options={{ title: 'Puzzle deslizante' }} />
        <Stack.Screen name="criptograma" options={{ title: 'Criptograma' }} />
        <Stack.Screen name="logros" options={{ title: 'Logros' }} />
      </Stack>
    </>
  );
}
