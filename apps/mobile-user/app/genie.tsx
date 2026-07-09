import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

const STEPS = [
  { icon: '🏪', text: 'Genie vai à loja' },
  { icon: '🛍️', text: 'Compra o produto' },
  { icon: '🏠', text: 'Entrega em sua casa' },
];

export default function GenieScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Genie de Compras</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>O que você precisa?</Text>
        <Text style={styles.subtitle}>Descreva os itens e nós compramos para você.</Text>

        <TextInput
          style={styles.textArea}
          placeholder="Ex: 2kg de arroz, 1L de óleo e um pack de água mineral..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Nome da Loja (Opcional)</Text>
        <TextInput style={styles.input} placeholder="Ex: Supermercado Kero" />

        <Text style={styles.label}>Limite de Orçamento</Text>
        <TextInput style={styles.input} placeholder="Quanto pretende gastar? (Kz)" keyboardType="numeric" />

        <Text style={styles.sectionTitle}>Como funciona?</Text>
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
              {i < STEPS.length - 1 && <Text style={styles.stepArrow}>→</Text>}
            </View>
          ))}
        </View>

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Taxa do Genie</Text>
          <Text style={styles.feeValue}>{formatCurrency(800)}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigateToOrderConfirmed({
            service: 'genie',
            dest: 'Compras Genie',
            label: 'Genie de Compras',
            amount: '800',
          })}
        >
          <Text style={styles.primaryBtnText}>SOLICITAR GENIE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: spacing.xl },
  textArea: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 15, minHeight: 100, marginBottom: spacing.lg },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 15, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.lg },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  step: { alignItems: 'center', flex: 1 },
  stepIcon: { fontSize: 28, marginBottom: 6 },
  stepText: { fontSize: 10, textAlign: 'center', fontWeight: '500' },
  stepArrow: { position: 'absolute', right: -10, top: 10, color: colors.gray300 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, backgroundColor: colors.gray50, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  feeLabel: { fontSize: 15, fontWeight: '600' },
  feeValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing['3xl'] },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
