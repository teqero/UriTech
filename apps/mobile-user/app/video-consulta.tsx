import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

const VIDEO_DOCTORS = [
  { name: 'Dr. Manuel Silva', specialty: 'Clínico Geral', rating: 4.8, price: 3500, slot: 'Hoje, 15:30' },
  { name: 'Dra. Ana Costa', specialty: 'Psicóloga', rating: 5.0, price: 5000, slot: 'Hoje, 16:00' },
  { name: 'Dr. André Mário', specialty: 'Cardiologia', rating: 4.9, price: 12000, slot: 'Amanhã, 09:00' },
];

export default function VideoConsultaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vídeo Consulta</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>📱 Telemedicina UriGo</Text>
        <Text style={styles.bannerSub}>Consulta por vídeo com médicos verificados — sem sair de casa.</Text>
      </View>

      <ScrollView style={styles.content}>
        {VIDEO_DOCTORS.map((doc) => (
          <View key={doc.name} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{doc.name}</Text>
              <Text style={styles.specialty}>{doc.specialty}</Text>
              <Text style={styles.meta}>⭐ {doc.rating} · {doc.slot}</Text>
            </View>
            <View style={styles.cardAction}>
              <Text style={styles.price}>{formatCurrency(doc.price)}</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigateToOrderConfirmed({
                  service: 'medico',
                  dest: doc.name,
                  label: `Vídeo consulta — ${doc.name}`,
                  amount: String(doc.price),
                })}
              >
                <Text style={styles.btnText}>INICIAR</Text>
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
  banner: { backgroundColor: '#E8F5E9', padding: spacing.xl, margin: spacing.xl, borderRadius: borderRadius.lg },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: colors.health },
  bannerSub: { fontSize: 13, color: colors.gray500, marginTop: 6 },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  specialty: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 4 },
  cardAction: { alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary },
  btn: { backgroundColor: colors.health, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
