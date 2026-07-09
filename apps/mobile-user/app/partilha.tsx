import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

const RIDES = [
  { name: 'Ricardo M.', rating: 4.9, time: 'Hoje, 17:30', price: 600, from: 'Central', to: 'Talatona', seats: 2 },
  { name: 'Sandra L.', rating: 4.9, time: 'Hoje, 08:00', price: 800, from: 'Kilamba', to: 'Maianga', seats: 1 },
];

export default function PartilhaScreen() {
  const [mode, setMode] = useState<'find' | 'offer'>('find');

  const reserve = (ride: typeof RIDES[0]) => {
    navigateToOrderConfirmed({
      service: 'partilha',
      dest: `${ride.from} → ${ride.to}`,
      label: `Partilha com ${ride.name}`,
      amount: String(ride.price),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partilha de Viagem</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'find' && styles.tabActive]}
          onPress={() => setMode('find')}
        >
          <Text style={mode === 'find' ? styles.tabTextActive : styles.tabText}>Encontrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'offer' && styles.tabActive]}
          onPress={() => setMode('offer')}
        >
          <Text style={mode === 'offer' ? styles.tabTextActive : styles.tabText}>Oferecer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {mode === 'find' ? (
          <>
            <Text style={styles.sectionTitle}>Próximas Viagens</Text>
            {RIDES.map((ride) => (
              <View key={ride.name} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <Text style={styles.rideName}>{ride.name}</Text>
                  <Text style={styles.rideRating}>⭐ {ride.rating}</Text>
                </View>
                <Text style={styles.rideTime}>{ride.time}</Text>
                <View style={styles.rideRoute}>
                  <Text style={styles.routeText}>{ride.from}</Text>
                  <Text>→</Text>
                  <Text style={styles.routeText}>{ride.to}</Text>
                </View>
                <View style={styles.rideFooter}>
                  <Text style={styles.seats}>{ride.seats} lugares disponíveis</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatCurrency(ride.price)}</Text>
                    <TouchableOpacity style={styles.reserveBtn} onPress={() => reserve(ride)}>
                      <Text style={styles.reserveText}>Reservar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <TouchableOpacity
            style={styles.offerCard}
            onPress={() => navigateToOrderConfirmed({
              service: 'partilha',
              dest: 'Oferta de viagem',
              label: 'Publicar viagem partilhada',
              amount: '600',
            })}
          >
            <Text style={styles.offerTitle}>Publicar a sua viagem</Text>
            <Text style={styles.offerSub}>Partilhe custos com outros passageiros na mesma rota.</Text>
            <Text style={styles.offerCta}>PUBLICAR VIAGEM →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.md, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: colors.primary },
  content: { flex: 1, padding: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  rideCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rideName: { fontSize: 16, fontWeight: '700' },
  rideRating: { fontSize: 13 },
  rideTime: { fontSize: 12, color: colors.gray500, marginBottom: 8 },
  rideRoute: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  routeText: { fontSize: 14, fontWeight: '500' },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seats: { fontSize: 12, color: colors.gray500 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary },
  reserveBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  reserveText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  offerCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl },
  offerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  offerSub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.lg },
  offerCta: { color: colors.primary, fontWeight: '700' },
});
