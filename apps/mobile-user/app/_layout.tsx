import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@uritech/shared';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileThemeProvider } from '../contexts/ProfileThemeContext';
import { ApiStatusBanner } from '../components/ApiStatusBanner';
import { RootErrorBoundary } from '../components/RootErrorBoundary';
import { reportClientError } from '../lib/client-diagnostics';

export const unstable_settings = {
  initialRouteName: 'index',
};

/** Expo Router error boundary (não usar ficheiro +error.tsx — crasha o router). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  void reportClientError(error, { source: 'expo-router-error-boundary' });
  return (
    <View style={errorStyles.wrap}>
      <Ionicons name="cloud-offline-outline" size={48} color="#B45309" />
      <Text style={errorStyles.title}>Não foi possível abrir este ecrã</Text>
      <Text style={errorStyles.sub}>{error.message}</Text>
      <TouchableOpacity style={errorStyles.btn} onPress={retry}>
        <Text style={errorStyles.btnText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    // @ts-expect-error GestureHandlerRootView children prop mismatch in newer RN types
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RootErrorBoundary>
        <AuthProvider>
          <ProfileThemeProvider>
            <ApiStatusBanner />
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(driver-tabs)" />
              <Stack.Screen name="(vendor-tabs)" />
              <Stack.Screen name="(delivery-tabs)" />
              <Stack.Screen name="(admin-portal)" />
              <Stack.Screen name="driver" options={{ presentation: 'card' }} />
              <Stack.Screen name="delivery" options={{ presentation: 'card' }} />
              <Stack.Screen name="taxi" options={{ presentation: 'card' }} />
              <Stack.Screen name="lojas" />
              <Stack.Screen name="envio" />
              <Stack.Screen name="genie" />
              <Stack.Screen name="partilha" />
              <Stack.Screen name="servicos" />
              <Stack.Screen name="medico" />
              <Stack.Screen name="beleza" />
              <Stack.Screen name="marketplace" />
              <Stack.Screen name="familia" />
              <Stack.Screen name="negocios" />
              <Stack.Screen name="automovel" />
              <Stack.Screen name="assistencia" />
              <Stack.Screen name="escrow" />
              <Stack.Screen name="securepay" />
              <Stack.Screen name="uriprova" />
              <Stack.Screen name="video-consulta" />
              <Stack.Screen name="wallet" />
              <Stack.Screen name="transferir-wallet" />
              <Stack.Screen name="sacar-wallet" />
              <Stack.Screen name="notificacoes" />
              <Stack.Screen name="pedido-confirmado" />
              <Stack.Screen name="rastreamento" />
              <Stack.Screen name="carregar-wallet" />
              <Stack.Screen name="licitar" />
              <Stack.Screen name="intercidades" />
              <Stack.Screen name="pool" />
              <Stack.Screen name="agendar" />
              <Stack.Screen name="ia-urigo" />
              <Stack.Screen name="pagar-produto" options={{ presentation: 'card' }} />
            </Stack>
          </ProfileThemeProvider>
        </AuthProvider>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

const errorStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.gray50,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.black, textAlign: 'center' },
  sub: { fontSize: 13, color: colors.gray700, textAlign: 'center' },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: '800' },
});
