import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, useColorScheme, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@uritech/shared';
import { importSocialProduct, PLATFORM_ICONS } from '../../lib/social-payments-api';
import { loadAuthSession } from '../../lib/auth-storage';

const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'OLX', 'Mercado Livre', 'eBay', 'AliExpress'];

export default function PagarProdutoScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? '#0f0f12' : colors.gray50;
  const card = dark ? '#1a1a22' : colors.white;
  const text = dark ? colors.white : colors.black;
  const muted = dark ? '#9ca3af' : colors.gray500;

  const handleImport = async () => {
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Cole o link do anúncio');
      return;
    }

    const session = await loadAuthSession();
    if (!session) {
      router.push('/(auth)/signin' as never);
      return;
    }

    setLoading(true);
    try {
      const record = await importSocialProduct(trimmed);
      router.push({
        pathname: '/pagar-produto/confirmacao',
        params: { id: record.id },
      } as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível importar o produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: dark ? '#6C63FF' : '#6C63FF' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar Produto</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: card }]}>
          <Text style={styles.heroEmoji}>🔗</Text>
          <Text style={[styles.heroTitle, { color: text }]}>Cole o link do anúncio</Text>
          <Text style={[styles.heroSub, { color: muted }]}>
            Pague com segurança produtos de Facebook, Instagram, OLX, Mercado Livre e muito mais.
          </Text>
        </View>

        <Text style={[styles.label, { color: muted }]}>Link do produto</Text>
        <View style={[styles.inputWrap, { backgroundColor: card, borderColor: dark ? '#333' : colors.gray100 }]}>
          <Ionicons name="link" size={20} color="#6C63FF" style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: text }]}
            placeholder="Cole aqui o link do produto"
            placeholderTextColor={muted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            multiline
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={() => void handleImport()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.primaryBtnText}>A importar produto…</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={20} color={colors.white} />
              <Text style={styles.primaryBtnText}>IMPORTAR PRODUTO</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: muted }]}>Plataformas suportadas</Text>
        <View style={styles.platformGrid}>
          {PLATFORMS.map((p) => (
            <View key={p} style={[styles.platformChip, { backgroundColor: card }]}>
              <Text style={styles.platformIcon}>{PLATFORM_ICONS[p.toLowerCase().split(' ')[0]] ?? '🔗'}</Text>
              <Text style={[styles.platformText, { color: text }]}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.secureBanner, { backgroundColor: dark ? '#1e1e2e' : '#EEEDFF' }]}>
          <Ionicons name="shield-checkmark" size={22} color="#6C63FF" />
          <Text style={[styles.secureText, { color: dark ? '#c4b5fd' : '#4338ca' }]}>
            UriPay actua como intermediária segura. Só usamos metadados públicos — nunca credenciais das redes sociais.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { padding: spacing.xl, paddingBottom: spacing['3xl'] },
  hero: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl },
  heroEmoji: { fontSize: 48, marginBottom: spacing.md },
  heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1,
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  input: { flex: 1, fontSize: 15, minHeight: 48, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: borderRadius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: spacing.xl,
  },
  primaryBtnDisabled: { opacity: 0.85 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  platformChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  platformIcon: { fontSize: 14 },
  platformText: { fontSize: 12, fontWeight: '600' },
  secureBanner: {
    flexDirection: 'row', gap: 12, padding: spacing.lg,
    borderRadius: borderRadius.lg, alignItems: 'flex-start',
  },
  secureText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
