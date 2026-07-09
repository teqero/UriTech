import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { APP_NAME, PHONE_PREFIX, colors, spacing, borderRadius } from '@uritech/shared';

export default function LoginScreen() {
  const [phone, setPhone] = useState('923 000 000');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Passo 1 de 2</Text>
        <Text style={styles.title}>Bem-vindo ao {APP_NAME}</Text>
        <Text style={styles.subtitle}>O seu dia a dia mais simples</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Número de Telefone</Text>
        <View style={styles.phoneInput}>
          <Text style={styles.prefix}>{PHONE_PREFIX}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="923 000 000"
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/verify')}>
          <Text style={styles.primaryBtnText}>Continuar</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>ou entrar com</Text>

        <TouchableOpacity style={styles.socialBtn}>
          <Text style={styles.socialText}>Continuar com Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn}>
          <Text style={styles.socialText}>Continuar com Facebook</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
        <Text style={styles.footer}>
          Já tem conta? <Text style={styles.link}>Entrar com e-mail</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        Ao continuar, aceita os nossos Termos de Serviço e Política de Privacidade
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 60 },
  header: { marginBottom: spacing['3xl'] },
  step: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.gray500 },
  form: { flex: 1 },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 8 },
  phoneInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.xl, overflow: 'hidden' },
  prefix: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, backgroundColor: colors.gray50, fontWeight: '600', fontSize: 15 },
  input: { flex: 1, padding: spacing.lg, fontSize: 15 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.xl },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  divider: { textAlign: 'center', color: colors.gray500, fontSize: 13, marginBottom: spacing.lg },
  socialBtn: { borderWidth: 1, borderColor: colors.gray100, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.md },
  socialText: { fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 14, color: colors.gray500, marginBottom: spacing.lg },
  link: { color: colors.primary, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: 11, color: colors.gray300, lineHeight: 16 },
});
