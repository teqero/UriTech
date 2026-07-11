import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, useColorScheme, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { fetchSocialPayment, syncSocialPayment } from '../../lib/social-payments-api';
import { shareOrderReference } from '../../lib/ui-actions';
import { goHome } from '../../lib/navigation';

export default function SucessoScreen() {
  const { id, ref, total, title } = useLocalSearchParams<{
    id?: string; ref?: string; total?: string; title?: string;
  }>();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [payment, setPayment] = useState<Awaited<ReturnType<typeof fetchSocialPayment>> | null>(null);
  const [syncing, setSyncing] = useState(false);

  const bg = dark ? '#0f0f12' : colors.white;
  const card = dark ? '#1a1a22' : colors.gray50;
  const text = dark ? colors.white : colors.black;
  const muted = dark ? '#9ca3af' : colors.gray500;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setPayment(await fetchSocialPayment(id));
    } catch { /* use params */ }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleSync = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      const updated = await syncSocialPayment(id);
      setPayment(updated);
    } finally {
      setSyncing(false);
    }
  };

  const receiptCode = ref ?? payment?.transactionId ?? '—';
  const displayTitle = title ?? payment?.title ?? 'Produto';
  const displayTotal = total ? Number(total) : payment?.total ?? 0;
  const syncMsg = payment?.syncMessage;

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <View style={styles.successIcon}><Text style={{ fontSize: 56 }}>✅</Text></View>
      <Text style={[styles.title, { color: text }]}>Pagamento Confirmado</Text>
      <Text style={[styles.sub, { color: muted }]}>A UriPay processou o seu pagamento com segurança.</Text>

      <View style={[styles.receipt, { backgroundColor: card }]}>
        <Text style={[styles.receiptTitle, { color: text }]}>Recibo UriPay</Text>
        {[
          { label: 'Produto', value: displayTitle },
          { label: 'Código', value: receiptCode },
          { label: 'Total pago', value: formatCurrency(displayTotal) },
          { label: 'Estado', value: 'PAGO' },
          { label: 'ID encomenda', value: payment?.orderId?.slice(0, 12) ?? '—' },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.rowLabel, { color: muted }]}>{row.label}</Text>
            <Text style={[styles.rowValue, { color: text }]} numberOfLines={2}>{row.value}</Text>
          </View>
        ))}
      </View>

      {syncMsg ? (
        <View style={[styles.syncCard, { backgroundColor: dark ? '#1e1e2e' : '#FFF8E8' }]}>
          <Ionicons name="sync-outline" size={22} color="#F06400" />
          <Text style={[styles.syncText, { color: dark ? '#fcd34d' : '#92400e' }]}>{syncMsg}</Text>
        </View>
      ) : null}

      {payment?.originalUrl ? (
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => void Linking.openURL(payment.originalUrl)}
        >
          <Ionicons name="open-outline" size={18} color="#6C63FF" />
          <Text style={styles.linkBtnText}>Abrir anúncio original</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.primaryBtn} onPress={() => void handleSync()} disabled={syncing}>
        {syncing ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>MARCAR COMO SINCRONIZADO</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => void shareOrderReference({
          service: 'UriPay Link',
          ref: receiptCode,
          dest: displayTitle,
          amount: String(displayTotal),
        })}
      >
        <Text style={styles.secondaryBtnText}>Partilhar recibo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tertiaryBtn}
        onPress={() => router.push('/(tabs)/activity' as never)}
      >
        <Text style={[styles.tertiaryText, { color: muted }]}>Ver no histórico</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goHome}>
        <Text style={[styles.homeLink, { color: '#6C63FF' }]}>Voltar ao início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, paddingTop: 80, alignItems: 'center', paddingBottom: spacing['3xl'] },
  successIcon: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, textAlign: 'center', marginBottom: spacing['2xl'] },
  receipt: { width: '100%', borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  receiptTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  syncCard: { flexDirection: 'row', gap: 12, padding: spacing.lg, borderRadius: borderRadius.lg, width: '100%', marginBottom: spacing.lg },
  syncText: { flex: 1, fontSize: 13, lineHeight: 18 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  linkBtnText: { color: '#6C63FF', fontWeight: '700' },
  primaryBtn: { width: '100%', backgroundColor: '#6C63FF', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.sm },
  primaryBtnText: { color: colors.white, fontWeight: '800' },
  secondaryBtn: { width: '100%', borderWidth: 1, borderColor: '#6C63FF', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.sm },
  secondaryBtnText: { color: '#6C63FF', fontWeight: '700' },
  tertiaryBtn: { padding: spacing.md, marginBottom: spacing.sm },
  tertiaryText: { fontSize: 14 },
  homeLink: { fontSize: 14, fontWeight: '600' },
});
