import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@uritech/shared';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada', headerShown: false }} />
      <View style={styles.wrap}>
        <Ionicons name="map-outline" size={56} color={colors.primary} />
        <Text style={styles.title}>Rota não encontrada</Text>
        <Text style={styles.sub}>Este endereço não existe na app UriGo.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Ir para início</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.gray50,
    gap: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.black },
  sub: { fontSize: 14, color: colors.gray700, textAlign: 'center' },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: '800' },
});