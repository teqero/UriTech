import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateTo, navigateToOrderConfirmed } from '../lib/navigation';

const DOCTORS = [
  { name: 'Dr. Manuel Silva', specialty: 'Clínico Geral', rating: 4.8, price: 5000 },
  { name: 'Dra. Ana Costa', specialty: 'Psicóloga', rating: 5.0, price: 7500 },
  { name: 'Dr. André Mário', specialty: 'Cardiologia', rating: 4.9, price: 25000 },
  { name: 'Dra. Elisa Benguela', specialty: 'Pediatria', rating: 4.8, price: 18500 },
];

const CATEGORY_ROUTES: Record<string, () => void> = {
  Consulta: () => {},
  'Vídeo Consulta': () => navigateTo('/video-consulta'),
  Farmácia: () => navigateTo('/lojas?category=farmacia'),
  Ambulância: () => navigateTo('/assistencia'),
  Veterinário: () => navigateTo('/beleza?tab=pet'),
};

export default function MedicoScreen() {
  const book = (name: string, price: number) => {
    navigateToOrderConfirmed({
      service: 'medico',
      dest: name,
      label: `Consulta — ${name}`,
      amount: String(price),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Serviços Médicos</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity style={styles.emergency} onPress={() => navigateTo('/assistencia')}>
        <Text style={styles.emergencyText}>🚨 EMERGÊNCIA: Central 113 · Assistência SOS</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {Object.keys(CATEGORY_ROUTES).map((cat) => (
            <TouchableOpacity key={cat} style={styles.categoryChip} onPress={CATEGORY_ROUTES[cat]}>
              <Text style={styles.categoryText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Médicos Disponíveis</Text>
        {DOCTORS.map((doc) => (
          <View key={doc.name} style={styles.doctorCard}>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doc.name}</Text>
              <Text style={styles.specialty}>{doc.specialty}</Text>
              <Text style={styles.rating}>⭐ {doc.rating}</Text>
            </View>
            <View style={styles.doctorAction}>
              <Text style={styles.price}>{formatCurrency(doc.price)}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={() => book(doc.name, doc.price)}>
                <Text style={styles.bookText}>AGENDAR</Text>
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
  header: { backgroundColor: colors.health, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  emergency: { backgroundColor: colors.error, padding: spacing.md, alignItems: 'center' },
  emergencyText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  content: { flex: 1, padding: spacing.xl },
  categories: { marginBottom: spacing.xl },
  categoryChip: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginRight: spacing.sm },
  categoryText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  doctorCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700' },
  specialty: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  rating: { fontSize: 12, marginTop: 4 },
  doctorAction: { alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bookBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  bookText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
