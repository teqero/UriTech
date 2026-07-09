import { type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getMobileHomeRoute, type AppProfileId } from '@uritech/shared';
import { colors } from '@uritech/shared';
import { useAuth } from '../contexts/AuthContext';

export function ProfileRouteGuard({
  allowedProfiles,
  children,
}: {
  allowedProfiles: AppProfileId[];
  children: ReactNode;
}) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  if (!allowedProfiles.includes(session.role)) {
    return <Redirect href={getMobileHomeRoute(session.role) as never} />;
  }

  return <>{children}</>;
}

/** Bloqueia rotas de cliente quando o perfil não é customer/service_provider/corporate */
export function CustomerAreaGuard({ children }: { children: ReactNode }) {
  return (
    <ProfileRouteGuard allowedProfiles={['customer', 'service_provider', 'corporate']}>
      {children}
    </ProfileRouteGuard>
  );
}

export function DriverAreaGuard({ children }: { children: ReactNode }) {
  return <ProfileRouteGuard allowedProfiles={['driver']}>{children}</ProfileRouteGuard>;
}

export function VendorAreaGuard({ children }: { children: ReactNode }) {
  return (
    <ProfileRouteGuard
      allowedProfiles={['vendor', 'restaurant', 'pharmacy', 'supermarket', 'store']}
    >
      {children}
    </ProfileRouteGuard>
  );
}

export function DeliveryAreaGuard({ children }: { children: ReactNode }) {
  return <ProfileRouteGuard allowedProfiles={['delivery_rider']}>{children}</ProfileRouteGuard>;
}

export function AdminAreaGuard({ children }: { children: ReactNode }) {
  return <ProfileRouteGuard allowedProfiles={['admin']}>{children}</ProfileRouteGuard>;
}
