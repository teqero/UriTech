import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

const CALENDAR_DAYS = [
  [1, 2, 3], [8, 9, 10], [15, 16, 17], [22, 23, 24], [29, 30, 31],
  [4, 11, 18, 25], [5, 12, 19, 26], [6, 13, 20, 27], [7, 14, 21, 28],
];

const UPCOMING = [
  { time: 'Amanhã às 08:30', dest: 'Aeroporto 4 de Fevereiro' },
  { time: '24 Out às 14:00', dest: 'Shopping Fortaleza' },
];

export default function AgendarScreen() {
  const [period, setPeriod] = useState<'manha' | 'tarde' | 'noite'>('manha');
  const [selectedDay, setSelectedDay] = useState(24);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar para Depois</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.serviceTabs}>
          {['Taxi', 'Envio', 'Serviços'].map((s, i) => (
            <TouchableOpacity key={s} style={[styles.serviceTab, i === 0 && styles.serviceTabActive]}>
              <Text style={[styles.serviceTabText, i === 0 && styles.serviceTabTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.monthTitle}>Outubro 2024</Text>
        <View style={styles.calendar}>
          {CALENDAR_DAYS.slice(0, 5).map((week, wi) => (
            <View key={wi} style={styles.calendarRow}>
              {week.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCell, selectedDay === day && styles.daySelected]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayText, selectedDay === day && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Horário</Text>
        <View style={styles.periodRow}>
          {(['manha', 'tarde', 'noite'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'manha' ? 'Manhã' : p === 'tarde' ? 'Tarde' : 'Noite'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Ponto de Recolha</Text>
          <Text style={styles.locationValue}>Sua Localização</Text>
        </View>
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Destino</Text>
          <Text style={styles.locationValue}>Aeroporto 4 de Fevereiro</Text>
        </View>

        <TouchableOpacity style={styles.notifyRow}>
          <View style={styles.checkbox} />
          <Text style={styles.notifyText}>Notificar 30 min antes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigateToOrderConfirmed({
            service: 'taxi',
            dest: 'Viagem agendada',
            label: `Agendamento dia ${selectedDay}`,
            amount: '1500',
          })}
        >
          <Text style={styles.primaryBtnText}>CONFIRMAR AGENDAMENTO</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Próximas Viagens</Text>
        {UPCOMING.map((trip) => (
          <View key={trip.time} style={styles.upcomingCard}>
            <Text style={styles.upcomingTime}>{trip.time}</Text>
            <Text style={styles.upcomingDest}>{trip.dest}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  serviceTabs: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: 4, marginBottom: spacing.xl },
  serviceTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.md },
  serviceTabActive: { backgroundColor: colors.primaryLight },
  serviceTabText: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  serviceTabTextActive: { color: colors.primary },
  monthTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  calendar: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.xl },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
  dayCell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 14, fontWeight: '600' },
  dayTextSelected: { color: colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.md },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray100 },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: colors.gray700 },
  periodTextActive: { color: colors.white },
  locationCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  locationLabel: { fontSize: 12, color: colors.gray500, marginBottom: 4 },
  locationValue: { fontSize: 15, fontWeight: '600' },
  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.xl },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: colors.primary, borderRadius: 4, backgroundColor: colors.primaryLight },
  notifyText: { fontSize: 14, fontWeight: '500' },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.xl },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  upcomingCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.gray100 },
  upcomingTime: { fontSize: 14, fontWeight: '700' },
  upcomingDest: { fontSize: 13, color: colors.gray500, marginTop: 4 },
});
