import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { routes } from '../../lib/navigation';
import { PHONE_PREFIX, colors, spacing, borderRadius } from '@uritech/shared';

export default function VerifyScreen() {
  const [code, setCode] = useState('');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verificar Número</Text>
      <Text style={styles.subtitle}>
        Enviamos um código de 6 dígitos para {PHONE_PREFIX} 923 XXX XXX
      </Text>

      <View style={styles.codeRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.codeBox, code.length === i && styles.codeBoxActive]}>
            <Text style={styles.codeDigit}>{code[i] || ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.hiddenInput}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      <Text style={styles.resend}>Reenviar código em 00:59</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace(routes.home)}>
        <Text style={styles.primaryBtnText}>Verificar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.changeNumber}>Alterar número</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 60 },
  back: { marginBottom: spacing['2xl'] },
  backText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray500, lineHeight: 22, marginBottom: spacing['3xl'] },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  codeBox: { width: 48, height: 56, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  codeBoxActive: { borderColor: colors.primary, borderWidth: 2 },
  codeDigit: { fontSize: 24, fontWeight: '700' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  resend: { textAlign: 'center', color: colors.gray500, fontSize: 13, marginBottom: spacing['2xl'] },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.lg },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  changeNumber: { textAlign: 'center', color: colors.primary, fontSize: 14, fontWeight: '600' },
});
