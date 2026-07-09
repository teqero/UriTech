import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { transferWallet } from '../lib/wallet-api';

export default function TransferirWalletScreen() {
  const [amount, setAmount] = useState('5000');
  const [email, setEmail] = useState('maria@uritech.com');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    const value = Number(amount) || 0;
    if (value <= 0) {
      Alert.alert('Transferir', 'Indique um valor válido.');
      return;
    }
    setLoading(true);
    try {
      await transferWallet(email.trim(), value);
      router.replace('/(tabs)/payment');
    } catch (e) {
      Alert.alert('Transferir', e instanceof Error ? e.message : 'Não foi possível transferir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transferir UriPay</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Email UriGo do destinatário</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Valor (Kz)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleTransfer} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>TRANSFERIR {formatCurrency(Number(amount) || 0)}</Text>
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
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
