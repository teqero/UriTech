import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DEFAULT_PROVINCE, colors, spacing, borderRadius } from '@uritech/shared';
import { TAB_SCROLL_PADDING } from '../../lib/layout';
import { routes } from '../../lib/navigation';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { icon: 'wallet-outline' as const, label: 'UriPay Wallet', route: routes.wallet },
  { icon: 'notifications-outline' as const, label: 'Notificações', route: routes.notificacoes },
  { icon: 'people-outline' as const, label: 'Rastrear Família', route: '/familia' },
  { icon: 'card-outline' as const, label: 'Métodos de Pagamento', route: routes.payment },
  { icon: 'help-circle-outline' as const, label: 'Ajuda e Suporte', route: '/ia-urigo' },
  { icon: 'settings-outline' as const, label: 'Configurações', route: '/(auth)/register' },
];

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const name = session?.user.name ?? 'Utilizador';
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.info}>{session?.user.email ?? ''} • {DEFAULT_PROVINCE}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.route as never)}
          >
            <Ionicons name={item.icon} size={22} color={colors.gray700} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
      <View style={{ height: TAB_SCROLL_PADDING }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingBottom: spacing['3xl'], alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  info: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  menu: { backgroundColor: colors.white, margin: spacing.xl, borderRadius: borderRadius.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', marginLeft: 14 },
  logoutBtn: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.error, alignItems: 'center' },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
