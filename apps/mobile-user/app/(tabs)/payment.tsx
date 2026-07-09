import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PAYMENT_METHODS, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { TAB_SCROLL_PADDING } from '../../lib/layout';
import { routes } from '../../lib/navigation';
import { fetchWallet, txIcon } from '../../lib/wallet-api';

const QUICK_ACTIONS = [
  { label: 'Carregar', icon: 'add' as const, route: '/carregar-wallet' },
  { label: 'Transferir', icon: 'swap-horizontal' as const, route: '/transferir-wallet' },
  { label: 'Sacar', icon: 'wallet-outline' as const, route: '/sacar-wallet' },
  { label: 'Histórico', icon: 'time-outline' as const, route: '/(tabs)/activity' },
];

export default function PaymentScreen() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(124500);
  const [mask, setMask] = useState('**** 4291');
  const [transactions, setTransactions] = useState<
    { id: string; title: string; when: string; amount: number; icon: 'car' | 'lock-open' | 'bag-handle' | 'add' | 'wallet-outline' }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const wallet = await fetchWallet();
      setBalance(wallet.balance);
      setMask(wallet.mask ?? '**** 4291');
      setTransactions(
        wallet.transactions.map((tx) => ({
          id: tx.id,
          title: tx.description,
          when: new Date(tx.createdAt).toLocaleString('pt-AO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          amount: tx.amount,
          icon: txIcon(tx.type),
        })),
      );
    } catch {
      /* fallback to defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const methods = PAYMENT_METHODS.filter((m) => m.type !== 'wallet');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>UriPay</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push(routes.profile)}>
            <Ionicons name="settings-outline" size={20} color={colors.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletCardHeader}>
            <View style={styles.walletCardTitleRow}>
              <Ionicons name="wallet" size={22} color={colors.white} />
              <Text style={styles.walletLabel}>UriPay Wallet</Text>
            </View>
            <Text style={styles.walletMask}>{mask}</Text>
          </View>
          <Text style={styles.walletSub}>Saldo disponível</Text>
          {loading ? (
            <ActivityIndicator color={colors.white} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.walletBalance}>{formatCurrency(balance)}</Text>
          )}
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as never)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color={colors.black} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>
        {methods.map((method, index) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodCard, index === 0 && styles.methodSelected]}
          >
            <View style={styles.methodIcon}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.methodLabel}>{method.label}</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addMethod}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addMethodText}>Adicionar novo método</Text>
        </TouchableOpacity>

        <View style={styles.txHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          <TouchableOpacity onPress={() => router.push(routes.activity)}>
            <Text style={styles.seeAll}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 && !loading ? (
          <Text style={styles.emptyTx}>Sem transacções recentes.</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons name={tx.icon} size={18} color={colors.gray700} />
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txWhen}>{tx.when}</Text>
              </View>
              <Text style={[styles.txAmount, tx.amount < 0 ? styles.txOut : styles.txIn]}>
                {tx.amount < 0 ? '- ' : '+ '}
                {formatCurrency(Math.abs(tx.amount))}
              </Text>
            </View>
          ))
        )}

        <View style={styles.links}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/securepay')}>
            <Text style={styles.linkText}>SecurePay — Pagar com Segurança</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkBtn, styles.linkPurple]} onPress={() => router.push('/ia-urigo')}>
            <Text style={styles.linkText}>Funcionalidades IA UriGo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  content: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingTop: 56, paddingBottom: TAB_SCROLL_PADDING },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.black },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  walletCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  walletCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletLabel: { fontSize: 18, fontWeight: '700', color: colors.white },
  walletMask: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  walletSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  walletBalance: { fontSize: 36, fontWeight: '700', color: colors.white, marginTop: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing['2xl'] },
  quickAction: { alignItems: 'center', width: 78 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '500', color: colors.black },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: colors.black },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  methodSelected: { borderColor: colors.primary, borderWidth: 2 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  addMethod: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  addMethodText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: colors.primary, fontWeight: '700', fontSize: 13, marginBottom: spacing.md },
  emptyTx: { color: colors.gray500, marginBottom: spacing.lg },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '700', color: colors.black },
  txWhen: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txOut: { color: '#DC2626' },
  txIn: { color: colors.primary },
  links: { marginTop: spacing['2xl'], gap: spacing.sm },
  linkBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.lg },
  linkPurple: { backgroundColor: '#6C63FF' },
  linkText: { color: colors.white, fontWeight: '600', textAlign: 'center' },
});
