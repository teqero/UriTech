import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@uritech/shared';

const VENDOR_RED = '#EE2737';

export default function VendorProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: VENDOR_RED }]}>
        <View style={styles.storeIcon}><Text style={{ fontSize: 40 }}>🛒</Text></View>
        <Text style={styles.storeName}>Kero Kilamba</Text>
        <Text style={styles.address}>Centralidade do Kilamba, Bloco T — Luanda</Text>
      </View>
      <View style={styles.info}>
        {[
          { label: 'Horário', value: '07:00 - 22:00' },
          { label: 'Categoria', value: 'Supermercado, Mercearia' },
          { label: 'Telefone', value: '+244 923 456 789' },
          { label: 'Gestor', value: 'Maria Kilamba' },
        ].map((item) => (
          <View key={item.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.editBtn}>
        <Text style={styles.editText}>Editar Informações da Loja</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingBottom: spacing['3xl'], alignItems: 'center' },
  storeIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  storeName: { color: colors.white, fontSize: 22, fontWeight: '700' },
  address: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, textAlign: 'center', paddingHorizontal: spacing.xl },
  info: { backgroundColor: colors.white, margin: spacing.xl, borderRadius: borderRadius.xl, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  infoLabel: { fontSize: 14, color: colors.gray500 },
  infoValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  editBtn: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: VENDOR_RED, alignItems: 'center' },
  editText: { color: colors.white, fontWeight: '700' },
});
