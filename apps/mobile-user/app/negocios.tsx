import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NEARBY_BUSINESSES, colors, spacing, borderRadius } from '@uritech/shared';
import { navigateTo } from '../lib/navigation';

const BIZ_ROUTES: Record<string, string> = {
  Restaurantes: '/lojas',
  Cafés: '/lojas',
  Salões: '/beleza',
  Spas: '/beleza',
  Ginásios: '/servicos',
  Eventos: '/servicos',
};

const CATEGORIES = ['Restaurantes', 'Salões', 'Cafés', 'Ginásios', 'Eventos', 'Spas'];

export default function NegociosScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const businesses = NEARBY_BUSINESSES.filter((biz) => {
    const matchesCategory = !selectedCategory || biz.category === selectedCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || biz.name.toLowerCase().includes(q) || biz.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Negócios Próximos</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.gray500} />
        <TextInput
          placeholder="Procurar por categoria ou nome..."
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.content}>
        {businesses.map((biz) => (
          <TouchableOpacity
            key={biz.name}
            style={styles.bizCard}
            onPress={() => navigateTo(BIZ_ROUTES[biz.category] ?? '/lojas')}
          >
            <View style={styles.bizInfo}>
              <View style={styles.bizHeader}>
                <Text style={styles.bizName}>{biz.name}</Text>
                <View style={[styles.statusBadge, !biz.open && styles.closedBadge]}>
                  <Text style={[styles.statusText, !biz.open && styles.closedText]}>{biz.open ? 'Aberto' : 'Fechado'}</Text>
                </View>
              </View>
              <Text style={styles.bizMeta}>{biz.category} • {biz.distance}</Text>
              <Text style={styles.rating}>⭐ {biz.rating}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, margin: spacing.xl, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg },
  searchInput: { flex: 1, fontSize: 14 },
  categories: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  categoryChip: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.gray100 },
  categoryChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  categoryText: { fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: colors.primary },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  bizCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  bizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bizName: { fontSize: 16, fontWeight: '700' },
  statusBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  closedBadge: { backgroundColor: colors.gray100 },
  statusText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  closedText: { color: colors.gray500 },
  bizMeta: { fontSize: 13, color: colors.gray500 },
  rating: { fontSize: 12, marginTop: 4 },
  bizInfo: { flex: 1 },
});
