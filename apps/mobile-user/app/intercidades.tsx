import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { INTERCITY_CLASSES, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { confirmServiceOrder } from '../lib/service-checkout';

export default function IntercidadesScreen() {
  const [passengers, setPassengers] = useState(1);
  const [selectedClass, setSelectedClass] = useState('1');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viagem Intercidades</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Origem</Text>
          <Text style={styles.locationValue}>Luanda</Text>
        </View>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Destino</Text>
          <Text style={styles.locationValue}>Benguela</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.fieldLabel}>Data</Text>
            <View style={styles.fieldBox}><Text style={styles.fieldValue}>24 Out, 2024</Text></View>
          </View>
          <View style={styles.half}>
            <Text style={styles.fieldLabel}>Hora</Text>
            <View style={styles.fieldBox}><Text style={styles.fieldValue}>08:30</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passageiros</Text>
        <View style={styles.passengerRow}>
          {[1, 2, 3].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.passengerBtn, passengers === n && styles.passengerActive]}
              onPress={() => setPassengers(n)}
            >
              <Text style={[styles.passengerText, passengers === n && styles.passengerTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Classe de Veículo</Text>
        {INTERCITY_CLASSES.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[styles.classCard, selectedClass === v.id && styles.classSelected]}
            onPress={() => setSelectedClass(v.id)}
          >
            <Text style={{ fontSize: 28 }}>{v.icon}</Text>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{v.name}</Text>
              <Text style={styles.classCapacity}>{v.capacity} pess.</Text>
            </View>
            <Text style={styles.classPrice}>{formatCurrency(v.price)}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.scheduleLink} onPress={() => router.push('/agendar')}>
          <Text style={styles.scheduleText}>Agendar para depois</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            const cls = INTERCITY_CLASSES.find((c) => c.id === selectedClass);
            void confirmServiceOrder({
              service: 'intercidades',
              dest: 'Benguela',
              label: `Intercidades ${cls?.name ?? 'Standard'}`,
              amount: cls?.price ?? 15000,
            });
          }}
        >
          <Text style={styles.primaryBtnText}>VER PREÇOS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  locationCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  locationLabel: { fontSize: 12, color: colors.gray500, marginBottom: 4 },
  locationValue: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  half: { flex: 1 },
  fieldLabel: { fontSize: 13, color: colors.gray500, marginBottom: 6 },
  fieldBox: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  fieldValue: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  passengerRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  passengerBtn: { width: 48, height: 48, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray100, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  passengerActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  passengerText: { fontSize: 16, fontWeight: '700', color: colors.gray700 },
  passengerTextActive: { color: colors.white },
  classCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.gray100 },
  classSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '600' },
  classCapacity: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  classPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  scheduleLink: { alignItems: 'center', marginVertical: spacing.lg },
  scheduleText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing['3xl'] },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
