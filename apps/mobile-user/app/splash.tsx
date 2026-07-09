import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { APP_NAME, colors, spacing } from '@uritech/shared';
import { useAuth } from '../contexts/AuthContext';
import { getMobileHomeRoute } from '@uritech/shared';

export default function SplashScreen() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (session) {
        router.replace(getMobileHomeRoute(session.role) as never);
      } else {
        router.replace('/onboarding' as never);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoLetter}>U</Text>
      </View>
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.tagline}>A sua cidade na palma da mão</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoLetter: { fontSize: 42, fontWeight: '800', color: colors.primary },
  brand: { color: colors.white, fontSize: 36, fontWeight: '800', marginBottom: 8 },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
});
