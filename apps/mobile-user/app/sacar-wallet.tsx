import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { withdrawWallet } from '../lib/wallet-api';

export default function SacarWalletScreen() {
  const [amount, setAmount] = useState('10000');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const value = Number(amount) || 0;
    if (value <= 0) {
      Alert.alert('Sacar', 'Indique um valor válido.');
      return;
    }
    setLoading(true);
    try {
      await withdrawWallet(value);
      router.replace('/(tabs)/payment');
    } catch (e) {
      Alert.alert('Sacar', e instanceof Error ? e.message : 'Não foi possível levantar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Sacar UriPay</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Valor a levantar (Kz)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Text style={styles.hint}>Levantamento para conta Multicaixa ou BAI Direto associada.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleWithdraw} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>SACAR {formatCurrency(Number(amount) || 0)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: 15 },
  hint: { fontSize: 12, color: colors.gray500, marginTop: spacing.md },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
