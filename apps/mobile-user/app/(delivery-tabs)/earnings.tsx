import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, formatCurrency } from '@uritech/shared';

export default function DeliveryEarningsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ganhos</Text>
      <Text style={styles.value}>{formatCurrency(8650)}</Text>
      <Text style={styles.sub}>Hoje • 6 entregas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, paddingTop: 60, backgroundColor: colors.gray50 },
  title: { fontSize: 20, fontWeight: '700' },
  value: { fontSize: 32, fontWeight: '700', marginTop: spacing.lg, color: '#F06400' },
  sub: { fontSize: 14, color: colors.gray500, marginTop: 8 },
});
