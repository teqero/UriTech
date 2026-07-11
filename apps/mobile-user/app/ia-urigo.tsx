import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@uritech/shared';

const AI_FEATURES = [
  { title: 'Renda Booster Ativo', desc: 'Ganhos +12% acima da média local', badge: 'Ativo', color: colors.primary },
  { title: 'Preço Dinâmico Inteligente', desc: 'Ajuste automático por procura', badge: '1.5x', color: colors.secondary },
  { title: 'Proteção Anti-Fraude', desc: 'Monitoramento em tempo real', badge: 'Nível: Baixo', color: colors.info },
  { title: 'Suporte IA 24h', desc: 'Assistente virtual multilingue', badge: 'Chat', color: '#6C63FF' },
  { title: 'WhatsApp Booking', desc: 'Reservas via mensagem', badge: '3 Ativas', color: '#25D366' },
  { title: 'Promoções Automáticas', desc: 'Códigos gerados para você', badge: 'URI24', color: colors.health },
  { title: 'Relatório de Pagamentos', desc: 'Sincronização de carteira', badge: 'Sinc: 2m atrás', color: colors.gray700 },
];

export default function IaUriGoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Funcionalidades IA UriGo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.healthCard}>
          <View>
            <Text style={styles.healthLabel}>Health Dashboard</Text>
            <Text style={styles.healthStatus}>Sistema Otimizado</Text>
          </View>
          <View style={styles.latencyBox}>
            <Text style={styles.latencyLabel}>Latência</Text>
            <Text style={styles.latencyValue}>45ms</Text>
          </View>
        </View>

        {AI_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.title}
            style={styles.featureCard}
            onPress={() => Alert.alert(feature.title, feature.desc, [{ text: 'OK' }])}
            activeOpacity={0.85}
          >
            <View style={styles.featureHeader}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <View style={[styles.featureBadge, { backgroundColor: `${feature.color}20` }]}>
                <Text style={[styles.featureBadgeText, { color: feature.color }]}>{feature.badge}</Text>
              </View>
            </View>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: '#6C63FF', paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
  content: { flex: 1, padding: spacing.xl },
  healthCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.xl },
  healthLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  healthStatus: { color: colors.white, fontSize: 18, fontWeight: '700', marginTop: 4 },
  latencyBox: { alignItems: 'flex-end' },
  latencyLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  latencyValue: { color: colors.white, fontSize: 24, fontWeight: '700' },
  featureCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  featureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  featureTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  featureBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  featureBadgeText: { fontSize: 11, fontWeight: '700' },
  featureDesc: { fontSize: 13, color: colors.gray500 },
});
