import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileThemeProvider } from '../contexts/ProfileThemeContext';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    // @ts-expect-error GestureHandlerRootView children prop mismatch in newer RN types
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileThemeProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
