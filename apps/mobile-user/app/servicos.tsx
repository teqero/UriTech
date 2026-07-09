import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEnabledOnDemandServices, colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToLicitar } from '../lib/navigation';

export default function ServicosScreen() {
  const services = getEnabledOnDemandServices();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Serviços sob Demanda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>O que você precisa hoje?</Text>
        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigateToLicitar(service.name)}
            >
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.providers}>{service.providersCount} prestadores</Text>
              <Text style={styles.priceFrom}>Desde {formatCurrency(service.priceFrom)}</Text>
            </TouchableOpacity>
          ))}
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
  title: { fontSize: 18, fontWeight: '700', marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  serviceCard: { width: '47%', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg },
  serviceName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  providers: { fontSize: 12, color: colors.gray500, marginBottom: 6 },
  priceFrom: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
