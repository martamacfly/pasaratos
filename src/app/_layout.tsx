import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Text, View } from 'react-native';
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
          options={{
            title: 'Pasaratos',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image source={require('../../assets/icon.png')} style={{ width: 32, height: 32, borderRadius: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Pasaratos</Text>
              </View>
            ),
          }}
        />
        <Stack.Screen name="sudoku" options={{ title: 'Sudoku' }} />
        <Stack.Screen name="palabra" options={{ title: 'Palabra oculta' }} />
        <Stack.Screen name="reinas" options={{ title: 'Reinas' }} />
        <Stack.Screen name="crucigrama" options={{ title: 'Crucigrama' }} />
        <Stack.Screen name="binario" options={{ title: 'Binario' }} />
        <Stack.Screen name="buscaminas" options={{ title: 'Buscaminas' }} />
        <Stack.Screen name="nonograma" options={{ title: 'Nonograma' }} />
        <Stack.Screen name="sopa" options={{ title: 'Sopa de letras' }} />
      </Stack>
    </>
  );
}
