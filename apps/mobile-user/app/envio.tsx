import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_ORIGIN,
  colors,
  spacing,
  borderRadius,
  formatCurrency,
  formatPlaceLabel,
} from '@uritech/shared';
import { DestinationSearchInput } from '../components/DestinationSearchInput';
import { confirmServiceOrder } from '../lib/service-checkout';

const SIZES = [
  { id: 'envelope', name: 'Envelope', desc: 'Até 1kg', price: 500, icon: '📨' },
  { id: 'medium', name: 'Caixa Média', desc: 'Até 5kg', price: 1200, icon: '📦' },
  { id: 'large', name: 'Caixa Grande', desc: 'Até 20kg', price: 2500, icon: '📫' },
];

const TRANSPORT = [
  { id: 'moto', name: 'Moto', icon: '🏍️' },
  { id: 'carro', name: 'Carro', icon: '🚗' },
  { id: 'van', name: 'Van', icon: '🚐' },
];

export default function EnvioScreen() {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedTransport, setSelectedTransport] = useState('moto');
  const [pickup, setPickup] = useState(formatPlaceLabel(DEFAULT_ORIGIN));
  const [dropoff, setDropoff] = useState('');
  const total = 1700;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar Encomenda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Local de Recolha</Text>
        <View style={styles.inputWrap}>
          <DestinationSearchInput
            value={pickup}
            onChangeText={setPickup}
            placeholder="Onde levantamos?"
            showPreview
          />
        </View>

        <Text style={styles.label}>Destino 1</Text>
        <View style={styles.inputWrap}>
          <DestinationSearchInput
            value={dropoff}
            onChangeText={setDropoff}
            placeholder="Para onde enviamos?"
            showPreview
          />
        </View>

        <Text style={styles.sectionTitle}>Tamanho da Encomenda</Text>
        <View style={styles.sizeGrid}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size.id}
              style={[styles.sizeCard, selectedSize === size.id && styles.sizeSelected]}
              onPress={() => setSelectedSize(size.id)}
            >
              <Text style={{ fontSize: 28 }}>{size.icon}</Text>
              <Text style={styles.sizeName}>{size.name}</Text>
              <Text style={styles.sizeDesc}>{size.desc}</Text>
              <Text style={styles.sizePrice}>{formatCurrency(size.price)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tipo de Transporte</Text>
        <View style={styles.transportRow}>
          {TRANSPORT.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.transportChip, selectedTransport === t.id && styles.transportSelected]}
              onPress={() => setSelectedTransport(t.id)}
            >
              <Text style={{ fontSize: 24 }}>{t.icon}</Text>
              <Text style={styles.transportName}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Preço Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          <Text style={styles.totalEta}>35-45 min • Agora</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => void confirmServiceOrder({
            service: 'envio',
            dest: dropoff,
            label: 'Envio de encomenda',
            amount: total,
          })}
        >
          <Text style={styles.primaryBtnText}>SOLICITAR ENVIO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 6, marginTop: spacing.md },
  inputWrap: { marginBottom: spacing.sm, zIndex: 20 },
  input: { borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, padding: spacing.lg, fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.md },
  sizeGrid: { flexDirection: 'row', gap: spacing.sm },
  sizeCard: { flex: 1, alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg },
  sizeSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  sizeName: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  sizeDesc: { fontSize: 10, color: colors.gray500 },
  sizePrice: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 4 },
  transportRow: { flexDirection: 'row', gap: spacing.md },
  transportChip: { flex: 1, alignItems: 'center', padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg },
  transportSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  transportName: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  totalCard: { backgroundColor: colors.gray50, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.xl, alignItems: 'center' },
  totalLabel: { fontSize: 13, color: colors.gray500 },
  totalValue: { fontSize: 28, fontWeight: '700', color: colors.primary, marginVertical: 4 },
  totalEta: { fontSize: 12, color: colors.gray500 },
  primaryBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing['3xl'] },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
