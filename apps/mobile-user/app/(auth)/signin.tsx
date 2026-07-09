import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { APP_NAME, DEMO_ACCOUNTS, colors, spacing, borderRadius } from '@uritech/shared';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('joao@uritech.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Entrar no {APP_NAME}</Text>
      <Text style={styles.subtitle}>Uma app para todos os perfis</Text>

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="seu@email.com"
      />

      <Text style={styles.label}>Palavra-passe</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>ENTRAR</Text>}
      </TouchableOpacity>

      <Text style={styles.demoTitle}>Contas de demonstração</Text>
      {DEMO_ACCOUNTS.map((acc) => (
        <TouchableOpacity
          key={acc.email}
          style={styles.demoBtn}
          onPress={() => { setEmail(acc.email); setPassword(acc.password); }}
        >
          <Text style={styles.demoLabel}>{acc.label}</Text>
          <Text style={styles.demoEmail}>{acc.email}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.alt}>Entrar com número de telefone →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: spacing['2xl'] },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, fontSize: 15 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.xl },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  demoTitle: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginBottom: spacing.md },
  demoBtn: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  demoLabel: { fontWeight: '700', fontSize: 14 },
  demoEmail: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  alt: { textAlign: 'center', color: colors.primary, fontWeight: '600', marginTop: spacing.lg },
});
