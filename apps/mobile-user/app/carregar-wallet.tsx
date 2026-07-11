import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { initiateMulticaixaTopup, simulateMulticaixaTopup, topUpWallet } from '../lib/wallet-api';

const AMOUNTS = [5000, 10000, 25000, 50000];

export default function CarregarWalletScreen() {
  const [amount, setAmount] = useState(25000);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const handleMulticaixa = async () => {
    setLoading(true);
    try {
      const init = await initiateMulticaixaTopup(amount);
      setReference(init.reference);
      Alert.alert(
        'Referência Multicaixa',
        `${init.instructions}\n\nReferência: ${init.reference}`,
        [{ text: 'OK' }],
      );
    } catch (e) {
      Alert.alert('Multicaixa', e instanceof Error ? e.message : 'Não foi possível gerar referência');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!reference) return;
    setLoading(true);
    try {
      await simulateMulticaixaTopup(reference);
      router.replace('/(tabs)/payment');
    } catch (e) {
      Alert.alert('Simulação', e instanceof Error ? e.message : 'Falhou');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantTopUp = async () => {
    setLoading(true);
    try {
      await topUpWallet(amount);
      router.replace('/(tabs)/payment');
    } catch (e) {
      Alert.alert('Carregar', e instanceof Error ? e.message : 'Não foi possível carregar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Carregar UriPay</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Quanto deseja carregar?</Text>
        <Text style={styles.amount}>{amount.toLocaleString('pt-AO')} Kz</Text>

        <View style={styles.amountGrid}>
          {AMOUNTS.map((a) => (
            <TouchableOpacity key={a} style={[styles.amountChip, amount === a && styles.amountSelected]} onPress={() => setAmount(a)}>
              <Text style={[styles.amountChipText, amount === a && styles.amountSelectedText]}>{formatCurrency(a)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Fonte de Pagamento</Text>
        <TouchableOpacity
          style={[styles.sourceCard, styles.sourceSelected]}
          onPress={() => Alert.alert('Multicaixa Express', 'Fonte de pagamento seleccionada para carregamento.')}
        >
          <Text style={styles.sourceText}>Multicaixa Express</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </TouchableOpacity>

        {reference ? (
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Referência gerada</Text>
            <Text style={styles.refValue}>{reference}</Text>
            <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulate} disabled={loading}>
              <Text style={styles.simulateText}>Simular pagamento confirmado</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Taxa de processamento</Text>
          <Text style={styles.feeValue}>Grátis</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleMulticaixa} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>GERAR REFERÊNCIA MULTICAIXA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleInstantTopUp} disabled={loading}>
          <Text style={styles.secondaryBtnText}>Carregamento instantâneo (demo)</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Com Multicaixa, o saldo é creditado após confirmação do banco</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  label: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: spacing.xl },
  amount: { fontSize: 40, fontWeight: '700', textAlign: 'center', color: colors.primary, marginVertical: spacing.xl },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing['2xl'] },
  amountChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg },
  amountSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  amountChipText: { fontSize: 13, fontWeight: '600' },
  amountSelectedText: { color: colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  sourceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  sourceSelected: { borderColor: colors.primary, borderWidth: 2 },
  sourceText: { fontSize: 15, fontWeight: '500' },
  refCard: { backgroundColor: colors.gray50, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  refLabel: { fontSize: 12, color: colors.gray500, fontWeight: '700' },
  refValue: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: spacing.md },
  simulateBtn: { backgroundColor: colors.secondary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  simulateText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.xl },
  feeLabel: { fontSize: 14, color: colors.gray500 },
  feeValue: { fontSize: 14, fontWeight: '700', color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: { marginTop: spacing.sm, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.gray100 },
  secondaryBtnText: { color: colors.gray700, fontWeight: '600' },
  note: { textAlign: 'center', fontSize: 12, color: colors.gray500, marginTop: spacing.md },
});
