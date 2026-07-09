import { Stack } from 'expo-router';
import { AdminAreaGuard } from '../../components/ProfileRouteGuard';

export default function AdminPortalLayout() {
  return (
    <AdminAreaGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </AdminAreaGuard>
  );
}
