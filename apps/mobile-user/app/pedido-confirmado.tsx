import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SERVICE_LABELS, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { goHome, navigateToTracking } from '../lib/navigation';
import { shareOrderReference } from '../lib/ui-actions';

export default function PedidoConfirmadoScreen() {
  const { service, dest, ref, label, amount } = useLocalSearchParams<{
    service?: string;
    dest?: string;
    ref?: string;
    label?: string;
    amount?: string;
  }>();

  const serviceKey = service ?? 'taxi';
  const serviceLabel = SERVICE_LABELS[serviceKey] ?? label ?? 'Pedido UriGo';
  const displayLabel = label || `${serviceLabel}${dest ? ` — ${dest}` : ''}`;
  const price = amount ? Number(amount) : 1500;
  const reference = ref ?? 'URI-98421';

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}><Text style={{ fontSize: 48 }}>✅</Text></View>
      <Text style={styles.title}>Pedido Confirmado</Text>
      <Text style={styles.subtitle}>Obrigado por confiar na UriGo Angola!</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
        {[
          { label: 'Serviço', value: displayLabel },
          { label: 'Referência', value: reference },
          { label: 'Valor Total', value: formatCurrency(Number.isFinite(price) ? price : 1500) },
          { label: 'Tempo Est.', value: '15 - 25 min' },
          { label: 'Estado', value: 'CONFIRMADO' },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={[styles.rowValue, row.label === 'Estado' && styles.status]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigateToTracking({
          service: serviceKey,
          dest: dest ?? '',
          ref: reference,
        })}
      >
        <Text style={styles.primaryBtnText}>Acompanhar no Mapa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => void shareOrderReference({
          service: displayLabel,
          ref: reference,
          dest: dest ?? '',
          amount: String(price),
        })}
      >
        <Text style={styles.secondaryBtnText}>Partilhar com Amigos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goHome}>
        <Text style={styles.homeLink}>Voltar ao Início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 80, alignItems: 'center' },
  successIcon: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: spacing['2xl'] },
  summary: { width: '100%', backgroundColor: colors.gray50, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing['2xl'] },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowLabel: { fontSize: 14, color: colors.gray500 },
  rowValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  status: { color: colors.secondary, fontWeight: '700' },
  primaryBtn: { width: '100%', backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { width: '100%', borderWidth: 1, borderColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.lg },
  secondaryBtnText: { color: colors.primary, fontWeight: '700' },
  homeLink: { color: colors.gray500, fontSize: 14 },
});
