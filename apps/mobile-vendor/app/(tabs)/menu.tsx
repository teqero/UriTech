import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

const VENDOR_RED = '#EE2737';

const INITIAL_MENU = [
  { id: '1', name: 'Arroz Tio João 5kg', price: 4850, available: true, emoji: '🍚' },
  { id: '2', name: 'Óleo de Palma Fula 1L', price: 1200, available: true, emoji: '🫒' },
  { id: '3', name: 'Frango Congelado 2kg', price: 2100, available: true, emoji: '🍗' },
  { id: '4', name: 'Leite Mimosa 1L', price: 450, available: false, emoji: '🥛' },
  { id: '5', name: 'Água Pura 1.5L', price: 150, available: true, emoji: '💧' },
];

export default function MenuScreen() {
  const [items, setItems] = useState(INITIAL_MENU);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: VENDOR_RED }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardápio — Kero Kilamba</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Item</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => toggle(item.id)} activeOpacity={0.85}>
            <View style={styles.menuImage}><Text style={{ fontSize: 32 }}>{item.emoji}</Text></View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={[styles.availBadge, { backgroundColor: item.available ? colors.primaryLight : '#FFF3E8' }]}>
              <Text style={{ color: item.available ? colors.primary : '#F06400', fontSize: 11, fontWeight: '600' }}>
                {item.available ? 'Disponível' : 'Indisponível'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <Text style={styles.hint}>Toque num item para alternar disponibilidade.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { padding: 4 },
  headerTitle: { flex: 1, color: colors.white, fontSize: 17, fontWeight: '700' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 12 },
  content: { flex: 1, padding: spacing.xl },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  menuImage: { width: 56, height: 56, borderRadius: borderRadius.lg, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
  availBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.gray500, marginTop: spacing.md },
});
