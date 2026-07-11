import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, ActivityIndicator, useColorScheme, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { fetchSocialPayment, platformLabel, PLATFORM_ICONS } from '../../lib/social-payments-api';

export default function ConfirmacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Awaited<ReturnType<typeof fetchSocialPayment>> | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const bg = dark ? '#0f0f12' : colors.gray50;
  const card = dark ? '#1a1a22' : colors.white;
  const text = dark ? colors.white : colors.black;
  const muted = dark ? '#9ca3af' : colors.gray500;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProduct(await fetchSocialPayment(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading || !product) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={[styles.loadingText, { color: muted }]}>A preparar pré-visualização…</Text>
      </View>
    );
  }

  const images = product.images.length > 0 ? product.images : [];
  const meta = product as typeof product & { metadata?: { completeness?: number; aiEnriched?: boolean } };
  const completeness = meta.metadata?.completeness ?? (product.price > 0 ? 80 : 40);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Produto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={[styles.gallery, { backgroundColor: card }]}>
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[imageIndex] }} style={styles.heroImage} resizeMode="cover" />
              {images.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs}>
                  {images.map((img, i) => (
                    <TouchableOpacity key={img} onPress={() => setImageIndex(i)}>
                      <Image
                        source={{ uri: img }}
                        style={[styles.thumb, i === imageIndex && styles.thumbActive]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ fontSize: 64 }}>{PLATFORM_ICONS[product.platform] ?? '🛒'}</Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.platformRow}>
            <Text style={styles.platformBadge}>
              {PLATFORM_ICONS[product.platform] ?? '🔗'} {platformLabel(product.platform)}
            </Text>
            <View style={styles.completeBadge}>
              <Text style={styles.completeText}>{completeness}% completo</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: text }]}>{product.title}</Text>
          <Text style={[styles.price, { color: '#6C63FF' }]}>
            {product.price > 0 ? formatCurrency(product.price) : 'Preço a confirmar no checkout'}
          </Text>

          {product.description ? (
            <Text style={[styles.desc, { color: muted }]}>{product.description}</Text>
          ) : null}

          <View style={styles.metaGrid}>
            {product.category ? <MetaChip label="Categoria" value={product.category} dark={dark} /> : null}
            {product.condition ? <MetaChip label="Condição" value={product.condition} dark={dark} /> : null}
            {product.brand ? <MetaChip label="Marca" value={product.brand} dark={dark} /> : null}
            {product.city ? <MetaChip label="Cidade" value={product.city} dark={dark} /> : null}
            {product.sellerName ? <MetaChip label="Vendedor" value={product.sellerName} dark={dark} /> : null}
          </View>

          <TouchableOpacity style={styles.linkRow} onPress={() => void Linking.openURL(product.originalUrl)}>
            <Ionicons name="open-outline" size={16} color="#6C63FF" />
            <Text style={styles.linkText} numberOfLines={1}>{product.originalUrl}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: card, borderTopColor: dark ? '#333' : colors.gray100 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push({ pathname: '/pagar-produto/checkout', params: { id: product.id } } as never)}
        >
          <Text style={styles.primaryBtnText}>CONTINUAR PARA PAGAMENTO</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MetaChip({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <View style={[styles.metaChip, { backgroundColor: dark ? '#252530' : colors.gray50 }]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, { color: dark ? colors.white : colors.black }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  header: {
    backgroundColor: '#6C63FF', paddingTop: 50, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  gallery: { margin: spacing.xl, borderRadius: borderRadius.xl, overflow: 'hidden' },
  heroImage: { width: '100%', height: 240 },
  thumbs: { padding: spacing.sm, flexDirection: 'row' },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 8, opacity: 0.6 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#6C63FF' },
  placeholder: { height: 200, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: borderRadius.xl, padding: spacing.xl },
  platformRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  platformBadge: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  completeBadge: { backgroundColor: '#EEEDFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  completeText: { fontSize: 10, fontWeight: '700', color: '#6C63FF' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', marginBottom: spacing.md },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  metaChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: '45%' },
  metaLabel: { fontSize: 10, color: colors.gray500, fontWeight: '600' },
  metaValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { flex: 1, fontSize: 12, color: '#6C63FF' },
  footer: { padding: spacing.xl, borderTopWidth: 1 },
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: borderRadius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
