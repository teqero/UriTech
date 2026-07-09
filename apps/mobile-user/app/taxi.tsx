import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_ORIGIN,
  VEHICLE_OPTIONS,
  colors,
  spacing,
  borderRadius,
  formatCurrency,
  formatPlaceLabel,
  previewDemoPlace,
  resolveDemoPlace,
} from '@uritech/shared';
import { UriMap } from '../components/UriMap';
import { DestinationSearchInput } from '../components/DestinationSearchInput';
import { navigateToTracking } from '../lib/navigation';
import { createRide } from '../lib/rides-api';
import { useAuth } from '../contexts/AuthContext';

type TaxiMode = 'fixed' | 'bid' | 'rent';

const BID_DRIVERS = [
  { name: 'João Pedro', rating: 4.9, offer: 1200 },
  { name: 'Sérgio Neto', rating: 4.7, offer: 1100 },
  { name: 'Kátia Santos', rating: 5.0, offer: 1300 },
];

export default function TaxiScreen() {
  const { dest } = useLocalSearchParams<{ dest?: string }>();
  const { session } = useAuth();
  const [mode, setMode] = useState<TaxiMode>('fixed');
  const [selectedVehicle, setSelectedVehicle] = useState('2');
  const [destination, setDestination] = useState(dest ?? '');
  const [booking, setBooking] = useState(false);

  const destPlace = useMemo(() => previewDemoPlace(destination), [destination]);
  const vehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicle) ?? VEHICLE_OPTIONS[1];

  const bookRide = async (fare: number, rideMode: TaxiMode = mode) => {
    if (!session) {
      router.push('/(auth)/signin' as never);
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Destino', 'Indique para onde vamos.');
      return;
    }

    const place = resolveDemoPlace(destination);
    const destLocation = place
      ? {
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.name,
          city: place.city,
          province: place.province,
          country: place.country,
        }
      : { latitude: -8.8383, longitude: 13.2344, address: destination, city: 'Luanda', country: 'Angola' };

    setBooking(true);
    try {
      const ride = await createRide({
        mode: rideMode,
        destination: destLocation,
        fare,
        vehicleType: vehicle.type,
      });
      navigateToTracking({ dest: destination, service: 'taxi', ref: ride.id });
    } catch (e) {
      Alert.alert('Reserva', e instanceof Error ? e.message : 'Não foi possível reservar');
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Taxi</Text>
        <View style={{ width: 24 }} />
      </View>

      <UriMap destinationLabel={destination} height={180} showUserLocation />

      <ScrollView style={styles.content}>
        <View style={styles.modeTabs}>
          {(['fixed', 'bid', 'rent'] as TaxiMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'fixed' ? 'Preço Fixo' : m === 'bid' ? 'Licitar' : 'Alugar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'fixed' && (
          <>
            <View style={styles.locationCard}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.locationText}>{formatPlaceLabel(DEFAULT_ORIGIN)}</Text>
            </View>
            <View style={[styles.locationCard, styles.destCard]}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <DestinationSearchInput
                value={destination}
                onChangeText={setDestination}
                onSubmit={(text) => setDestination(text)}
                placeholder="Para onde vamos? + Paragem"
                compact
              />
            </View>

            {destPlace && (
              <Text style={styles.destHint}>📍 {destPlace.name} · {destPlace.district}</Text>
            )}

            <Text style={styles.sectionTitle}>Escolha o veículo</Text>
            {VEHICLE_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, selectedVehicle === v.id && styles.vehicleSelected]}
                onPress={() => setSelectedVehicle(v.id)}
              >
                <Text style={{ fontSize: 28 }}>{v.icon}</Text>
                <Text style={styles.vehicleName}>{v.name}</Text>
                <Text style={styles.vehiclePrice}>{formatCurrency(v.price)}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.scheduleLink} onPress={() => router.push('/agendar')}>
              <Text style={styles.scheduleText}>Agendar Viagem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, booking && styles.primaryBtnDisabled]}
              disabled={booking}
              onPress={() => void bookRide(vehicle.price, 'fixed')}
            >
              {booking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>RESERVAR {vehicle.name.toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {mode === 'bid' && (
          <>
            <Text style={styles.sectionTitle}>Sua Oferta</Text>
            <View style={styles.bidInput}>
              <Text style={styles.bidAmount}>1.000</Text>
              <Text style={styles.bidCurrency}>Kz</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/licitar')}>
              <Text style={styles.primaryBtnText}>Licitar</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Motoristas Próximos (3)</Text>
            {BID_DRIVERS.map((driver) => (
              <View key={driver.name} style={styles.driverCard}>
                <View>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverRating}>⭐ {driver.rating}</Text>
                </View>
                <View style={styles.driverOffer}>
                  <Text style={styles.offerPrice}>{formatCurrency(driver.offer)}</Text>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    disabled={booking}
                    onPress={() => void bookRide(driver.offer, 'bid')}
                  >
                    <Text style={styles.acceptText}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {mode === 'rent' && (
          <View style={styles.rentCard}>
            <Text style={styles.rentTitle}>Alugar Veículo</Text>
            <Text style={styles.rentPrice}>{formatCurrency(1200)}</Text>
            <Text style={styles.rentDesc}>Aluguer por hora com motorista</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              disabled={booking}
              onPress={() => void bookRide(1200, 'rent')}
            >
              <Text style={styles.primaryBtnText}>Alugar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  modeTabs: { flexDirection: 'row', backgroundColor: colors.gray50, borderRadius: borderRadius.lg, padding: 4, marginBottom: spacing.xl },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md },
  modeTabActive: { backgroundColor: colors.white },
  modeTabText: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  modeTabTextActive: { color: colors.primary },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  destCard: { alignItems: 'flex-start', zIndex: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  locationText: { fontSize: 14, fontWeight: '500', flex: 1 },
  destHint: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: spacing.md, marginTop: -4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.md },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  vehicleSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  vehicleName: { flex: 1, fontSize: 15, fontWeight: '600' },
  vehiclePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  scheduleLink: { alignItems: 'center', marginVertical: spacing.lg },
  scheduleText: { color: colors.primary, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing['3xl'] },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  bidInput: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  bidAmount: { fontSize: 48, fontWeight: '700' },
  bidCurrency: { fontSize: 20, color: colors.gray500 },
  driverCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  driverName: { fontSize: 15, fontWeight: '600' },
  driverRating: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  driverOffer: { alignItems: 'flex-end', gap: 6 },
  offerPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  acceptBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  acceptText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  rentCard: { alignItems: 'center', padding: spacing['2xl'] },
  rentTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  rentPrice: { fontSize: 36, fontWeight: '700', color: colors.primary },
  rentDesc: { fontSize: 14, color: colors.gray500, marginBottom: spacing.xl },
});
