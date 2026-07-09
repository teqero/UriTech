import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ride-request" options={{ presentation: 'modal' }} />
        <Stack.Screen name="navigation" />
        <Stack.Screen name="trip-complete" />
      </Stack>
    </>
  );
}
