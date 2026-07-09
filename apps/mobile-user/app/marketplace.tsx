import { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateTo, navigateToOrderConfirmed } from '../lib/navigation';
import {
  type MarketplaceTab,
  type MarketplaceFilters,
  DEFAULT_MARKETPLACE_FILTERS,
  MARKETPLACE_LISTINGS,
  MARKETPLACE_CITIES,
  MARKETPLACE_BRANDS,
  MARKETPLACE_CATEGORIES,
  PRICE_PRESETS,
  countActiveFilters,
  filterMarketplaceListings,
} from '../lib/marketplace-filters';

const TABS = ['Imóveis', 'Carros', 'Itens'] as const;

function tabIndexFromParam(tab?: string): number {
  if (tab === 'carros') return 1;
  if (tab === 'itens') return 2;
  return 0;
}

function tabKeyFromIndex(index: number): MarketplaceTab {
  if (index === 1) return 'carros';
  if (index === 2) return 'itens';
  return 'imoveis';
}

function Chip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState(tabIndexFromParam(tab));
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_MARKETPLACE_FILTERS);
  const [draft, setDraft] = useState<MarketplaceFilters>(DEFAULT_MARKETPLACE_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setActiveTab(tabIndexFromParam(tab));
  }, [tab]);

  const tabKey = tabKeyFromIndex(activeTab);
  const allItems = MARKETPLACE_LISTINGS[tabKey];
  const items = useMemo(() => filterMarketplaceListings(allItems, filters, tabKey), [allItems, filters, tabKey]);
  const activeCount = countActiveFilters(filters, tabKey);

  const openFilters = () => {
    setDraft(filters);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters(draft);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setDraft(DEFAULT_MARKETPLACE_FILTERS);
    setFilters(DEFAULT_MARKETPLACE_FILTERS);
    setShowFilters(false);
  };

  const toggleQuickType = (type: MarketplaceFilters['type']) => {
    setFilters((prev) => ({ ...prev, type: prev.type === type ? 'all' : type }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace UriGo</Text>
        <TouchableOpacity onPress={openFilters} accessibilityLabel="Abrir filtros" style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={24} color={colors.white} />
          {activeCount > 0 ? (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeCount}</Text></View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[styles.tab, activeTab === i ? styles.tabActive : undefined]}
            onPress={() => {
              setActiveTab(i);
              setFilters(DEFAULT_MARKETPLACE_FILTERS);
            }}
          >
            <Text style={[styles.tabText, activeTab === i ? styles.tabTextActive : undefined]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters} contentContainerStyle={styles.quickFiltersContent}>
        <Chip label="Venda" active={filters.type === 'venda'} onPress={() => toggleQuickType('venda')} />
        <Chip label="Aluguer" active={filters.type === 'aluguer'} onPress={() => toggleQuickType('aluguer')} />
        {MARKETPLACE_CITIES.filter((c) => c !== 'all').slice(0, 4).map((city) => (
          <Chip
            key={city}
            label={city}
            active={filters.city === city}
            onPress={() => setFilters((prev) => ({ ...prev, city: prev.city === city ? 'all' : city }))}
          />
        ))}
        <TouchableOpacity style={styles.moreFiltersChip} onPress={openFilters}>
          <Ionicons name="filter" size={14} color="#6C63FF" />
          <Text style={styles.moreFiltersText}>Mais filtros</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {items.length} resultado{items.length !== 1 ? 's' : ''} em {TABS[activeTab]}
          </Text>
          <TouchableOpacity onPress={openFilters}>
            <Text style={styles.filter}>
              Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Nenhum anúncio encontrado</Text>
            <Text style={styles.emptySub}>Ajuste os filtros ou limpe a selecção</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={resetFilters}>
              <Text style={styles.clearBtnText}>LIMPAR FILTROS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listingCard}
              onPress={() => {
                if (tabKey === 'itens') {
                  navigateTo('/securepay');
                } else {
                  navigateToOrderConfirmed({
                    service: tabKey === 'carros' ? 'carros' : 'imoveis',
                    dest: item.title,
                    label: item.title,
                    amount: String(item.price),
                  });
                }
              }}
            >
              <View style={styles.listingImage}>
                <Text style={{ fontSize: 40 }}>{item.icon}</Text>
              </View>
              <View style={styles.listingInfo}>
                <View style={styles.listingHeader}>
                  <Text style={styles.listingPrice}>{formatCurrency(item.price)}</Text>
                  <View style={[styles.typeBadge, item.type === 'aluguer' ? styles.rentBadge : undefined]}>
                    <Text style={styles.typeText}>{item.type === 'venda' ? 'Venda' : 'Aluguer'}</Text>
                  </View>
                </View>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingMeta}>
                  {item.city}
                  {item.bedrooms !== undefined && item.bedrooms > 0 ? ` • T${item.bedrooms}` : ''}
                  {item.brand ? ` • ${item.brand}` : ''}
                  {item.year ? ` • ${item.year}` : ''}
                  {item.category ? ` • ${item.category}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.announceBtn}>
          <Text style={styles.announceText}>ANUNCIAR</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtros — {TABS[activeTab]}</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Tipo de negócio</Text>
              <View style={styles.chipRow}>
                {(['all', 'venda', 'aluguer'] as const).map((t) => (
                  <Chip
                    key={t}
                    label={t === 'all' ? 'Todos' : t === 'venda' ? 'Venda' : 'Aluguer'}
                    active={draft.type === t}
                    onPress={() => setDraft((p) => ({ ...p, type: t }))}
                  />
                ))}
              </View>

              <Text style={styles.filterLabel}>Zona / Cidade</Text>
              <View style={styles.chipRow}>
                {MARKETPLACE_CITIES.map((city) => (
                  <Chip
                    key={city}
                    label={city === 'all' ? 'Todas' : city}
                    active={draft.city === city}
                    onPress={() => setDraft((p) => ({ ...p, city }))}
                  />
                ))}
              </View>

              <Text style={styles.filterLabel}>Faixa de preço</Text>
              <View style={styles.chipRow}>
                {PRICE_PRESETS.map((preset) => {
                  const active = draft.priceMin === preset.min && draft.priceMax === preset.max;
                  return (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      active={active}
                      onPress={() => setDraft((p) => ({ ...p, priceMin: preset.min, priceMax: preset.max }))}
                    />
                  );
                })}
              </View>

              {tabKey === 'imoveis' ? (
                <>
                  <Text style={styles.filterLabel}>Quartos</Text>
                  <View style={styles.chipRow}>
                    {(['all', '1', '2', '3+'] as const).map((b) => (
                      <Chip
                        key={b}
                        label={b === 'all' ? 'Todos' : b === '3+' ? 'T3+' : `T${b}`}
                        active={draft.bedrooms === b}
                        onPress={() => setDraft((p) => ({ ...p, bedrooms: b }))}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {tabKey === 'carros' ? (
                <>
                  <Text style={styles.filterLabel}>Marca</Text>
                  <View style={styles.chipRow}>
                    {MARKETPLACE_BRANDS.map((brand) => (
                      <Chip
                        key={brand}
                        label={brand === 'all' ? 'Todas' : brand}
                        active={draft.brand === brand}
                        onPress={() => setDraft((p) => ({ ...p, brand }))}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {tabKey === 'itens' ? (
                <>
                  <Text style={styles.filterLabel}>Categoria</Text>
                  <View style={styles.chipRow}>
                    {MARKETPLACE_CATEGORIES.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat === 'all' ? 'Todas' : cat}
                        active={draft.category === cat}
                        onPress={() => setDraft((p) => ({ ...p, category: cat }))}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.filterLabel}>Ordenar por</Text>
              <View style={styles.chipRow}>
                <Chip label="Recentes" active={draft.sort === 'recent'} onPress={() => setDraft((p) => ({ ...p, sort: 'recent' }))} />
                <Chip label="Preço ↑" active={draft.sort === 'price_asc'} onPress={() => setDraft((p) => ({ ...p, sort: 'price_asc' }))} />
                <Chip label="Preço ↓" active={draft.sort === 'price_desc'} onPress={() => setDraft((p) => ({ ...p, sort: 'price_desc' }))} />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setDraft(DEFAULT_MARKETPLACE_FILTERS)}>
                <Text style={styles.resetText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyText}>APLICAR FILTROS</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: {
    backgroundColor: '#6C63FF', paddingTop: 50, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  filterIconBtn: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  filterBadge: {
    position: 'absolute', top: -4, right: -6, backgroundColor: colors.secondary,
    minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md, marginHorizontal: 4 },
  tabActive: { backgroundColor: '#EEEDFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
  quickFilters: { backgroundColor: colors.white, maxHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  quickFiltersContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray100, marginRight: 8,
  },
  chipActive: { backgroundColor: '#EEEDFF', borderColor: '#6C63FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  chipTextActive: { color: '#6C63FF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  moreFiltersChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: '#6C63FF', marginRight: 8,
  },
  moreFiltersText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  content: { flex: 1, padding: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  filter: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
  listingCard: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  listingImage: {
    width: 80, height: 80, backgroundColor: colors.gray50, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  listingInfo: { flex: 1 },
  listingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listingPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  rentBadge: { backgroundColor: '#FFF3E8' },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  listingTitle: { fontSize: 14, fontWeight: '600' },
  listingMeta: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13, color: colors.gray500, marginBottom: spacing.lg },
  clearBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: '#6C63FF' },
  clearBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 13 },
  announceBtn: { backgroundColor: '#6C63FF', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  announceText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.gray100, borderRadius: 2, alignSelf: 'center', marginVertical: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  modalScroll: { maxHeight: 420 },
  filterLabel: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  resetBtn: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray100, alignItems: 'center' },
  resetText: { fontWeight: '700', color: colors.gray500 },
  applyBtn: { flex: 2, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: '#6C63FF', alignItems: 'center' },
  applyText: { color: colors.white, fontWeight: '700' },
});
