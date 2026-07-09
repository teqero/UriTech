import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';

export default function DriverProfileScreen() {
  const { session, logout } = useAuth();
  const theme = useProfileTheme();
  const name = session?.user.name ?? 'Motorista';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.avatar}><Text style={[styles.avatarText, { color: theme.primary }]}>{name.charAt(0)}</Text></View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.info}>🚗 LD-44-23 • ⭐ 4.9</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNum}>1.250</Text><Text style={styles.statLabel}>Corridas</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{formatCurrency(4500000)}</Text><Text style={styles.statLabel}>Ganhos Total</Text></View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { paddingTop: 50, paddingBottom: spacing['3xl'], alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  avatarText: { fontSize: 32, fontWeight: '700' },
  name: { color: colors.white, fontSize: 22, fontWeight: '700' },
  info: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  stats: { flexDirection: 'row', margin: spacing.xl, gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  logoutBtn: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
  logoutText: { color: colors.error, fontWeight: '600' },
});
