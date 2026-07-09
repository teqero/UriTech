import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@uritech/shared';

const ITEMS = ['Entrega URI-98452 — 1.450 Kz', 'Entrega URI-98440 — 980 Kz', 'Entrega URI-98438 — 1.200 Kz'];

export default function DeliveryHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>
      {ITEMS.map((item) => (
        <View key={item} style={styles.card}><Text>{item}</Text></View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: 60, backgroundColor: colors.gray50 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
});
