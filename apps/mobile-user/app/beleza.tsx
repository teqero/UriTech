import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { confirmServiceOrder } from '../lib/service-checkout';

const SPECIALISTS = [
  { name: 'Salão Glamour Luanda', service: 'Cabelo & Unhas', rating: 4.9, price: 12000 },
  { name: 'Studio K', service: 'Maquiagem Profissional', rating: 5.0, price: 25000 },
  { name: 'Barbearia Central', service: 'Corte Masculino', rating: 4.7, price: 5000 },
];

const PET_SERVICES = [
  { name: 'Pet Spa Luanda', service: 'Banho & Tosa', rating: 4.8, price: 8000 },
  { name: 'VetCare Kilamba', service: 'Consulta Veterinária', rating: 4.9, price: 15000 },
  { name: 'Dog Walker AO', service: 'Passeio & Cuidados', rating: 4.6, price: 4500 },
];

const CATEGORIES = ['Cabelo', 'Facial', 'Maquiagem', 'Pedicure', 'Masculino'];
const PET_CATEGORIES = ['Banho', 'Tosa', 'Veterinário', 'Passeio', 'Hotel'];

export default function BelezaScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'beleza' | 'pet'>(tab === 'pet' ? 'pet' : 'beleza');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'pet') setActiveTab('pet');
  }, [tab]);

  const list = (activeTab === 'pet' ? PET_SERVICES : SPECIALISTS).filter((spec) => {
    if (!selectedCategory) return true;
    return spec.service.toLowerCase().includes(selectedCategory.toLowerCase());
  });
  const categories = activeTab === 'pet' ? PET_CATEGORIES : CATEGORIES;

  const book = (name: string, price: number) => {
    void confirmServiceOrder({
      service: activeTab === 'pet' ? 'petcare' : 'beleza',
      dest: name,
      label: activeTab === 'pet' ? `Pet Care — ${name}` : `Beleza — ${name}`,
      amount: price,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beleza e Cuidados</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'beleza' && styles.tabActive]}
          onPress={() => {
            setActiveTab('beleza');
            setSelectedCategory(null);
          }}
        >
          <Text style={activeTab === 'beleza' ? styles.tabTextActive : styles.tabText}>Beleza</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pet' && styles.tabActive]}
          onPress={() => {
            setActiveTab('pet');
            setSelectedCategory(null);
          }}
        >
          <Text style={activeTab === 'pet' ? styles.tabTextActive : styles.tabText}>Pet Care</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          {activeTab === 'pet' ? 'Cuidados para Pets' : 'Especialistas Sugeridos'}
        </Text>
        {list.map((spec) => (
          <View key={spec.name} style={styles.specCard}>
            <View style={styles.specInfo}>
              <Text style={styles.specName}>{spec.name}</Text>
              <Text style={styles.specService}>{spec.service}</Text>
              <Text style={styles.rating}>⭐ {spec.rating}</Text>
            </View>
            <View style={styles.specAction}>
              <Text style={styles.price}>{formatCurrency(spec.price)}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={() => book(spec.name, spec.price)}>
                <Text style={styles.bookText}>RESERVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: '#E91E8C', paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: '#FCE4EC' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: '#E91E8C' },
  content: { flex: 1, padding: spacing.xl },
  categories: { marginBottom: spacing.xl },
  categoryChip: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.gray100 },
  categoryChipActive: { backgroundColor: '#FCE4EC', borderColor: '#E91E8C' },
  categoryText: { fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#E91E8C' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  specCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  specInfo: { flex: 1 },
  specName: { fontSize: 15, fontWeight: '700' },
  specService: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  rating: { fontSize: 12, marginTop: 4 },
  specAction: { alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bookBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  bookText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
