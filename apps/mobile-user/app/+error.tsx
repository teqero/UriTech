import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, type ErrorBoundaryProps } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@uritech/shared';
import { reportClientError } from '../lib/client-diagnostics';

export default function GlobalRouteError({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    void reportClientError(error, { source: 'expo-router-error' });
  }, [error]);

  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={48} color="#B45309" />
      <Text style={styles.title}>Não foi possível abrir este ecrã</Text>
      <Text style={styles.sub}>{error.message}</Text>
      <TouchableOpacity style={styles.btnPrimary} onPress={retry}>
        <Text style={styles.btnText}>Tentar novamente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnGhost} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.btnGhostText}>Voltar ao início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  btnPrimary: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: '800' },
  btnGhost: { paddingVertical: spacing.sm },
  btnGhostText: { color: colors.primary, fontWeight: '700' },
});