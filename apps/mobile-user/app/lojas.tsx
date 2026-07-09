import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NEARBY_STORES, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';
import { createStoreOrder } from '../lib/orders-api';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { key: 'supermercado', label: 'Supermercado', icon: '🛒' },
  { key: 'farmacia', label: 'Farmácia', icon: '💊' },
  { key: 'flores', label: 'Flores', icon: '💐' },
  { key: 'agua', label: 'Água', icon: '💧' },
];

const DEMO_BASKET_KZ = 3500;

export default function LojasScreen() {
  const { store: storeId, category } = useLocalSearchParams<{ store?: string; category?: string }>();
  const { session } = useAuth();
  const [orderingStoreId, setOrderingStoreId] = useState<string | null>(null);

  const stores = useMemo(() => {
    let list = NEARBY_STORES;
    if (category) list = list.filter((s) => s.category === category);
    if (storeId) {
      const picked = list.find((s) => s.id === storeId);
      if (picked) return [picked, ...list.filter((s) => s.id !== storeId)];
    }
    return list;
  }, [storeId, category]);

  const orderFromStore = async (id: string, name: string, deliveryFee: number) => {
    if (!session) {
      router.push('/(auth)/signin' as never);
      return;
    }

    const total = DEMO_BASKET_KZ + deliveryFee;
    setOrderingStoreId(id);
    try {
      const order = await createStoreOrder({
        storeId: id,
        storeName: name,
        deliveryFee,
        total,
        payWithWallet: true,
        items: [
          {
            name: `Encomenda demo — ${name}`,
            quantity: 1,
            price: DEMO_BASKET_KZ,
            menuItemId: id,
          },
        ],
      });

      navigateToOrderConfirmed({
        service: 'lojas',
        dest: name,
        label: `Encomenda — ${name}`,
        amount: String(total),
        ref: order.id,
      });
    } catch (e) {
      Alert.alert('Pedido', e instanceof Error ? e.message : 'Não foi possível confirmar o pedido');
    } finally {
      setOrderingStoreId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lojas e Entregas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
              onPress={() => router.setParams({ category: cat.key })}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {stores.map((store) => {
          const busy = orderingStoreId === store.id;
          const previewTotal = DEMO_BASKET_KZ + store.deliveryFee;
          return (
            <TouchableOpacity
              key={store.id}
              style={[styles.storeCard, storeId === store.id && styles.storeCardHighlight]}
              disabled={busy}
              onPress={() => orderFromStore(store.id, store.name, store.deliveryFee)}
            >
              <View style={styles.storeIcon}>
                <Text style={{ fontSize: 32 }}>
                  {store.category === 'supermercado' ? '🛒' : store.category === 'farmacia' ? '💊' : store.category === 'flores' ? '💐' : '💧'}
                </Text>
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeTime}>{store.deliveryTime}</Text>
                <Text style={styles.storeFee}>
                  Demo ~{formatCurrency(previewTotal)} (UriPay) • Entrega {formatCurrency(store.deliveryFee)}
                </Text>
              </View>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.promoBanner}>
          <Text style={styles.promoTitle}>Destaques da Semana</Text>
          <Text style={styles.promoSubtitle}>40% de desconto em farmácias selecionadas</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  categories: { marginBottom: spacing.xl },
  categoryChip: { alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginRight: spacing.md, minWidth: 80, borderWidth: 2, borderColor: 'transparent' },
  categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: 11, fontWeight: '600' },
  storeCard: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  storeCardHighlight: { borderWidth: 2, borderColor: colors.primary },
  storeIcon: { width: 64, height: 64, backgroundColor: colors.gray50, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  storeTime: { fontSize: 13, color: colors.gray500 },
  storeFee: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  promoBanner: { backgroundColor: colors.health, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.md },
  promoTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  promoSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
});
