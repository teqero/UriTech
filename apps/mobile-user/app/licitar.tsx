import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { navigateToOrderConfirmed } from '../lib/navigation';

const BIDS = [
  { name: 'João Pedro', rating: 4.9, experience: '5 anos', price: 12000 },
  { name: 'Carlos Manuel', rating: 4.8, experience: '8 anos', price: 15000 },
  { name: 'Sérgio Neto', rating: 4.7, experience: '3 anos', price: 10500 },
];

const CATEGORIES = ['Canalização', 'Electricidade', 'Pintura', 'Reparações'];

export default function LicitarScreen() {
  const { service } = useLocalSearchParams<{ service?: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Licitar para Serviços</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Publicar Tarefa</Text>
        <TextInput style={styles.input} placeholder="Título da tarefa (ex: Reparar torneira)" defaultValue={service ?? ''} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={styles.categoryChip}><Text style={styles.categoryText}>{cat}</Text></TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput style={styles.textArea} placeholder="Descrição detalhada..." multiline />
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Seu Orçamento (Kz)</Text>
            <TextInput style={styles.input} defaultValue="8.000" keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Data</Text>
            <TextInput style={styles.input} defaultValue="Hoje" />
          </View>
        </View>
        <Text style={styles.label}>Localização</Text>
        <TextInput style={styles.input} defaultValue="Kilamba, Bloco T" />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigateToOrderConfirmed({
            service: 'servicos',
            dest: service ?? 'Licitação',
            label: 'Licitar serviço',
            amount: '8000',
          })}
        >
          <Text style={styles.primaryBtnText}>PEDIR LICITAÇÕES</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Licitações Ativas (3)</Text>
        {BIDS.map((bid) => (
          <View key={bid.name} style={styles.bidCard}>
            <View style={styles.bidInfo}>
              <Text style={styles.bidName}>{bid.name}</Text>
              <Text style={styles.bidMeta}>⭐ {bid.rating} • {bid.experience}</Text>
            </View>
            <View style={styles.bidAction}>
              <Text style={styles.bidPrice}>{formatCurrency(bid.price)}</Text>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => navigateToOrderConfirmed({
                  service: 'servicos',
                  dest: bid.name,
                  label: `Licitação — ${bid.name}`,
                  amount: String(bid.price),
                })}
              ><Text style={styles.acceptText}>Aceitar</Text></TouchableOpacity>
            </View>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: 15, backgroundColor: colors.white, marginBottom: spacing.md },
  textArea: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: 15, backgroundColor: colors.white, minHeight: 80, marginBottom: spacing.md, textAlignVertical: 'top' },
  categories: { marginBottom: spacing.md },
  categoryChip: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginRight: spacing.sm },
  categoryText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 6 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  bidCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  bidInfo: { flex: 1 },
  bidName: { fontSize: 15, fontWeight: '700' },
  bidMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  bidAction: { alignItems: 'flex-end', gap: 6 },
  bidPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  acceptBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  acceptText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
