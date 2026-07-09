import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

export default function TripCompleteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Viagem Concluída!</Text>
      <Text style={styles.subtitle}>O pagamento foi creditado na sua conta UriPay.</Text>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>Ganho desta viagem</Text>
          <Text style={styles.value}>{formatCurrency(2800)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ganhos de hoje</Text>
          <Text style={styles.value}>{formatCurrency(15250)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avaliação do cliente</Text>
          <Text style={styles.value}>⭐ 5.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.primaryBtnText}>VOLTAR AO INÍCIO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 80, alignItems: 'center' },
  icon: { fontSize: 56, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginBottom: spacing['2xl'] },
  summary: { width: '100%', backgroundColor: colors.gray50, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing['2xl'] },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  label: { fontSize: 14, color: colors.gray500 },
  value: { fontSize: 14, fontWeight: '700' },
  primaryBtn: { width: '100%', backgroundColor: '#1A73E8', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
