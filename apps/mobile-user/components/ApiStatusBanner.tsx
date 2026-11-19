import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@uritech/shared';
import { checkApiHealth } from '../lib/api';

type Status = 'checking' | 'online' | 'offline';

export function ApiStatusBanner() {
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
      setMessage('Sem internet neste dispositivo.');
      return;
    }
    setStatus('checking');
    const res = await checkApiHealth();
    setStatus(res.ok ? 'online' : 'offline');
    setMessage(res.ok ? undefined : res.message);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    const onOnline = () => void refresh();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOnline);
    }
    return () => {
      clearInterval(t);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOnline);
      }
    };
  }, [refresh]);

  if (status === 'checking') return null;
  if (status === 'online') return null;

  return (
    <View style={styles.banner}>
      {status === 'checking' ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Ionicons name="cloud-offline-outline" size={18} color={colors.white} />
      )}
      <View style={styles.textWrap}>
        <Text style={styles.title}>Sem ligação à API</Text>
        <Text style={styles.sub}>{message ?? 'Verifique a rede e tente novamente.'}</Text>
      </View>
      <TouchableOpacity onPress={() => void refresh()} style={styles.btn} accessibilityLabel="Tentar novamente">
        <Text style={styles.btnText}>Repetir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#B45309',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textWrap: { flex: 1 },
  title: { color: colors.white, fontWeight: '800', fontSize: 13 },
  sub: { color: '#FEF3C7', fontSize: 11, marginTop: 2 },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
});