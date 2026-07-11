import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NOTIFICATIONS, colors, spacing, borderRadius } from '@uritech/shared';
import { navigateToTracking } from '../lib/navigation';

export default function NotificacoesScreen() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => {
    setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));
    Alert.alert('Notificações', 'Todas marcadas como lidas.');
  };

  const openNotification = (n: (typeof NOTIFICATIONS)[0]) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    navigateToTracking({ service: 'taxi', dest: n.message, ref: `URI-${n.id}` });
  };

  const today = NOTIFICATIONS.filter((n) => n.group === 'today');
  const earlier = NOTIFICATIONS.filter((n) => n.group === 'earlier');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <TouchableOpacity onPress={markAllRead}><Text style={styles.markAll}>Marcar tudo</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.groupTitle}>Hoje</Text>
        {today.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notifCard, readIds.has(n.id) && styles.notifRead]}
            onPress={() => openNotification(n)}
          >
            <Text style={styles.notifTitle}>{n.title}</Text>
            <Text style={styles.notifMessage}>{n.message}</Text>
            <Text style={styles.notifTime}>{n.time}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.groupTitle}>Anteriormente</Text>
        {earlier.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notifCard, styles.notifRead, readIds.has(n.id) && { opacity: 0.6 }]}
            onPress={() => openNotification(n)}
          >
            <Text style={styles.notifTitle}>{n.title}</Text>
            <Text style={styles.notifMessage}>{n.message}</Text>
            <Text style={styles.notifTime}>{n.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  markAll: { color: colors.white, fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: spacing.xl },
  groupTitle: { fontSize: 14, fontWeight: '700', color: colors.gray500, marginBottom: spacing.md, marginTop: spacing.md },
  notifCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary },
  notifRead: { borderLeftColor: colors.gray300, opacity: 0.8 },
  notifTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  notifMessage: { fontSize: 13, color: colors.gray500, lineHeight: 18 },
  notifTime: { fontSize: 11, color: colors.gray300, marginTop: 6 },
});
