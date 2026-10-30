import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
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
      </Stack>
    </>
  );
}
