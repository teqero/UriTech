import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { TAB_SCROLL_PADDING } from '../../lib/layout';
import { navigateToTracking } from '../../lib/navigation';

const activities = [
  { id: '1', type: 'Taxi', service: 'taxi', desc: 'Luanda → Aeroporto 4 de Fevereiro', amount: 1500, status: 'Concluída', date: '04 Jul', ref: 'URI-98421' },
  { id: '2', type: 'Lojas', service: 'lojas', desc: 'Supermercado Kilamba', amount: 8500, status: 'Entregue', date: '03 Jul', ref: 'URI-98443' },
  { id: '3', type: 'Envio', service: 'envio', desc: 'Envelope para Maianga', amount: 500, status: 'Em trânsito', date: '03 Jul', ref: 'URI-98450' },
  { id: '4', type: 'Serviços', service: 'servicos', desc: 'Eletricista - Reparação', amount: 5000, status: 'Agendado', date: '02 Jul', ref: 'URI-98451' },
];

export default function ActivityScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Atividade</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {activities.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigateToTracking({
              service: item.service,
              dest: item.desc,
              ref: item.ref,
            })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.desc}>{item.desc}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: TAB_SCROLL_PADDING },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  type: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  date: { fontSize: 12, color: colors.gray500 },
  desc: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '700' },
});
