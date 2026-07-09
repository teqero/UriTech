import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { routes } from '../../lib/navigation';
import { APP_NAME, ANGOLA_PROVINCES, colors, spacing, borderRadius } from '@uritech/shared';

export default function RegisterScreen() {
  const [accepted, setAccepted] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Criar Conta {APP_NAME}</Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Primeiro Nome</Text>
          <TextInput style={styles.input} placeholder="Ex: João" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Apelido</Text>
          <TextInput style={styles.input} placeholder="Ex: Pedro" />
        </View>
      </View>

      <Text style={styles.label}>E-mail</Text>
      <TextInput style={styles.input} placeholder="seu@email.com" keyboardType="email-address" />

      <Text style={styles.label}>Província</Text>
      <View style={styles.select}>
        <Text style={styles.selectText}>{ANGOLA_PROVINCES[0]}</Text>
        <Text>▾</Text>
      </View>

      <Text style={styles.label}>Código de Referência (Opcional)</Text>
      <TextInput style={styles.input} placeholder="Insira o código" />

      <TouchableOpacity style={styles.checkbox} onPress={() => setAccepted(!accepted)}>
        <View style={[styles.check, accepted && styles.checkActive]} />
        <Text style={styles.checkLabel}>
          Eu li e aceito os Termos e Condições de utilização do {APP_NAME}.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, !accepted && styles.disabled]}
        onPress={() => router.replace(routes.home)}
        disabled={!accepted}
      >
        <Text style={styles.primaryBtnText}>Criar Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: spacing.xl },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: spacing['2xl'] },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 6, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: 15 },
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md },
  selectText: { fontSize: 15 },
  checkbox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: spacing.xl, marginBottom: spacing.xl },
  check: { width: 22, height: 22, borderWidth: 2, borderColor: colors.gray300, borderRadius: 4, marginTop: 2 },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { flex: 1, fontSize: 13, color: colors.gray500, lineHeight: 20 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
