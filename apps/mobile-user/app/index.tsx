import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '@uritech/shared';
import { useAuth } from '../contexts/AuthContext';
import { getMobileHomeRoute } from '@uritech/shared';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href={getMobileHomeRoute(session.role) as never} />;
  }

  // Figma: Splash → Onboarding → Auth
  return <Redirect href="/splash" />;
}
