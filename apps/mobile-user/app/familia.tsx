import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FAMILY_MEMBERS, colors, spacing, borderRadius } from '@uritech/shared';

export default function FamiliaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Rastrear Família</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.mapArea}><Text style={styles.mapText}>🗺️ Mapa de localização</Text></View>
      <Text style={styles.privacy}>Sua localização é partilhada apenas com membros autorizados por si.</Text>
      <ScrollView style={styles.content}>
        {FAMILY_MEMBERS.map((m) => (
          <View key={m.name} style={styles.memberCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{m.name[0]}</Text></View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberStatus}>{m.status}</Text>
            </View>
            <View style={styles.memberMeta}>
              <Text style={styles.battery}>🔋 {m.battery}%</Text>
              <Text style={styles.distance}>Distância {m.distance}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  mapArea: { height: 200, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center' },
  mapText: { color: colors.gray500 },
  privacy: { fontSize: 11, color: colors.gray500, textAlign: 'center', padding: spacing.md, backgroundColor: colors.primaryLight },
  content: { flex: 1, padding: spacing.xl },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.lg, borderWidth: 1, borderColor: colors.gray100, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 18 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700' },
  memberStatus: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  memberMeta: { alignItems: 'flex-end' },
  battery: { fontSize: 12, fontWeight: '600' },
  distance: { fontSize: 11, color: colors.gray500, marginTop: 4 },
});
