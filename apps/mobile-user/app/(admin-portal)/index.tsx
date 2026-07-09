import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors, spacing, borderRadius } from '@uritech/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';

export default function AdminPortalScreen() {
  const { logout, session } = useAuth();
  const theme = useProfileTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={styles.title}>Painel Admin</Text>
        <Text style={styles.sub}>Olá, {session?.user.name}</Text>
      </View>
      <Text style={styles.hint}>
        No telemóvel, o painel administrativo completo está optimizado para Web.
        Abra o UriGo no browser para gestão avançada.
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme.primary }]}
        onPress={() => Linking.openURL('http://localhost:3001/admin')}
      >
        <Text style={styles.btnText}>ABRIR ADMIN WEB</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Terminar sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, paddingTop: 60 },
  header: { padding: spacing.xl, borderRadius: borderRadius.xl, marginBottom: spacing.xl },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  hint: { fontSize: 14, color: colors.gray500, lineHeight: 20, marginBottom: spacing.xl },
  btn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  btnText: { color: colors.white, fontWeight: '700' },
  logout: { marginTop: spacing.xl, alignItems: 'center' },
  logoutText: { color: colors.error, fontWeight: '600' },
});
