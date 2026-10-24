import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHydrated } from '../store/useStore';
import { colors } from '../theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const hydrated = useHydrated();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        {!hydrated ? (
          <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="sessao" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="exercicio/[id]" options={{ title: '' }} />
            <Stack.Screen name="dia/[planId]/[dayId]" options={{ title: 'Editar treino' }} />
            <Stack.Screen name="selecionar-exercicio" options={{ title: 'Escolher exercício', presentation: 'modal' }} />
            <Stack.Screen name="novo-exercicio" options={{ title: 'Exercício personalizado', presentation: 'modal' }} />
            <Stack.Screen name="alimento" options={{ title: 'Adicionar alimento', presentation: 'modal' }} />
            <Stack.Screen name="novo-alimento" options={{ title: 'Alimento personalizado', presentation: 'modal' }} />
            <Stack.Screen name="metas" options={{ title: 'Metas de nutrição' }} />
            <Stack.Screen name="perfil" options={{ title: 'Perfil e configurações' }} />
            <Stack.Screen name="planos" options={{ title: 'Meus planos' }} />
            <Stack.Screen name="historico/[id]" options={{ title: 'Treino realizado' }} />
          </Stack>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
