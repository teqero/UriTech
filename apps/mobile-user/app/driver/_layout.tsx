import { Stack } from 'expo-router';
import { DriverAreaGuard } from '../../components/ProfileRouteGuard';

export default function DriverStackLayout() {
  return (
    <DriverAreaGuard>
      <Stack screenOptions={{ headerShown: false, presentation: 'card' }} />
    </DriverAreaGuard>
  );
}
