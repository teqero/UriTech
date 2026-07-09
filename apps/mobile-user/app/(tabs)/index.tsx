import { memo, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_ORIGIN, SERVICES, PROMO_BANNERS,
  NEARBY_STORES, ADDITIONAL_HOME_TILES, colors, spacing, borderRadius, formatPlaceLabel, type Service,
} from '@uritech/shared';
import { cx } from '../../lib/styles';
import { TAB_SCROLL_PADDING } from '../../lib/layout';
import { navigateTo, navigateToTaxi } from '../../lib/navigation';
import { DestinationSearchInput } from '../../components/DestinationSearchInput';

const QUICK_LINKS = [
  { label: 'Viagem Intercidades', route: '/intercidades', icon: '🚌' },
  { label: 'UriGo Pool', route: '/pool', icon: '👥' },
  { label: 'Agendar Viagem', route: '/agendar', icon: '📅' },
  { label: 'SecurePay', route: '/securepay', icon: '🔒', desc: 'Pagar com Segurança' },
  { label: 'UriProva', route: '/uriprova', icon: '📋', desc: 'Evidências de sinistro' },
] as const;

const ServiceTile = memo(function ServiceTile({
  service,
  onPress,
}: {
  service: Service;
  onPress: (route: string) => void;
}) {
  const route = service.route || '/(tabs)';
  return (
    <TouchableOpacity
      style={cx(styles.serviceCard, service.featured ? styles.serviceCardFeatured : undefined)}
      onPress={() => onPress(route)}
      activeOpacity={0.7}
    >
      <View style={cx(styles.serviceIcon, { backgroundColor: `${service.color}15` })}>
        <Text style={styles.serviceEmoji}>{service.icon}</Text>
      </View>
      <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = useState('');
  const navigate = useCallback((route: string) => navigateTo(route), []);

  const handleTaxiSearch = useCallback((text?: string) => {
    const dest = (text ?? destination).trim();
    navigateToTaxi(dest || undefined);
  }, [destination]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 8 }]}>
        <View style={styles.locationBar}>
          <Ionicons name="location" size={16} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationCity}>{DEFAULT_CITY}, {DEFAULT_COUNTRY}</Text>
            <Text style={styles.locationQuestion}>Transporte, entregas e muito mais</Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('/notificacoes')} style={styles.notifBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.taxiSearchWrap}>
          <DestinationSearchInput
            variant="home"
            value={destination}
            onChangeText={setDestination}
            onSubmit={(text) => handleTaxiSearch(text)}
            placeholder="Para onde vamos?"
            leading={
              <View style={styles.taxiSearchIcon}>
                <Text style={{ fontSize: 20 }}>🚕</Text>
              </View>
            }
            trailing={
              <TouchableOpacity style={styles.taxiSearchBtn} onPress={() => handleTaxiSearch()} activeOpacity={0.85}>
                <Text style={styles.taxiSearchBtnText}>IR</Text>
              </TouchableOpacity>
            }
          />
          <Text style={styles.taxiSearchHint}>Origem: {formatPlaceLabel(DEFAULT_ORIGIN)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
        removeClippedSubviews={Platform.OS !== 'web'}
      >
        <TouchableOpacity style={styles.taxiHero} onPress={() => handleTaxiSearch()} activeOpacity={0.9}>
          <View style={styles.taxiHeroLeft}>
            <Text style={styles.taxiHeroBadge}>MAIS PEDIDO</Text>
            <Text style={styles.taxiHeroTitle}>Taxi UriGo</Text>
            <Text style={styles.taxiHeroSub}>
              {destination.trim() ? `Destino: ${destination.trim()}` : 'Moto, Standard, Premium ou Tuk-tuk'}
            </Text>
            <View style={styles.taxiHeroCta}>
              <Text style={styles.taxiHeroCtaText}>RESERVAR AGORA</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </View>
          <Text style={styles.taxiHeroEmoji}>🚕</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Serviços UriGo</Text>
        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <ServiceTile key={service.id} service={service} onPress={navigate} />
          ))}
        </View>

        {PROMO_BANNERS.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={[styles.promoCard, { backgroundColor: promo.backgroundColor }]}
            onPress={() => navigateTo(promo.id === '1' ? '/taxi' : '/lojas?category=farmacia')}
            activeOpacity={0.9}
          >
            <Text style={styles.promoTitle}>{promo.title}</Text>
            <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lojas Próximas</Text>
          <TouchableOpacity onPress={() => navigate('/lojas')}>
            <Text style={styles.seeAll}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.storesGrid}>
          {NEARBY_STORES.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => navigateTo(`/lojas?store=${store.id}`)}
            >
              <View style={styles.storeImage}>
                <Text style={styles.storeEmoji}>
                  {store.category === 'supermercado' ? '🛒' : store.category === 'farmacia' ? '💊' : store.category === 'flores' ? '💐' : '💧'}
                </Text>
              </View>
              <Text style={styles.storeName} numberOfLines={2}>{store.name}</Text>
              <Text style={styles.storeMeta}>⭐ {store.rating} • {store.deliveryTime}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickLinks}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.route}
              style={styles.quickLink}
              onPress={() => navigate(link.route)}
              activeOpacity={0.7}
            >
              <View style={cx(styles.quickLinkInner, 'desc' in link && link.desc ? styles.quickLinkFeatured : undefined)}>
                <Text style={styles.quickLinkIcon}>{link.icon}</Text>
                <View style={styles.quickLinkBody}>
                  <Text style={styles.quickLinkText}>{link.label}</Text>
                  {'desc' in link && link.desc ? (
                    <Text style={styles.quickLinkDesc}>{link.desc}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mais serviços Gojek</Text>
        </View>
        <View style={styles.additionalGrid}>
          {ADDITIONAL_HOME_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.route}
              style={styles.additionalTile}
              onPress={() => navigate(tile.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.additionalIcon}>{tile.icon}</Text>
              <Text style={styles.additionalLabel} numberOfLines={2}>{tile.label}</Text>
              {tile.desc ? (
                <Text style={styles.additionalDesc} numberOfLines={2}>{tile.desc}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const GAP = spacing.sm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, overflow: 'hidden' },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    zIndex: 1000,
    elevation: 16,
    ...(Platform.OS === 'web' ? { overflow: 'visible' as const } : {}),
  },
  locationBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  notifBtn: { padding: 6, marginLeft: 8 },
  locationCity: { color: colors.white, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  locationQuestion: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginLeft: 8 },
  taxiSearchWrap: { gap: 8, zIndex: 1001, position: 'relative' },
  taxiSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 4,
    paddingLeft: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  taxiSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  taxiSearchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.black, paddingVertical: 12 },
  taxiSearchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    marginLeft: 4,
  },
  taxiSearchBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  taxiSearchHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginLeft: 4 },
  content: { flex: 1, zIndex: 0 },
  scrollContent: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: TAB_SCROLL_PADDING },
  taxiHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  taxiHeroLeft: { flex: 1 },
  taxiHeroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  taxiHeroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  taxiHeroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: spacing.md, lineHeight: 18 },
  taxiHeroCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  taxiHeroCtaText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  taxiHeroEmoji: { fontSize: 56, marginLeft: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.gray500, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xl, marginHorizontal: -GAP / 2 },
  serviceCard: {
    width: '25%',
    paddingHorizontal: GAP / 2,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: GAP,
  },
  serviceCardFeatured: {
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderRadius: borderRadius.lg,
    backgroundColor: '#f5f4ff',
  },
  serviceIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  serviceEmoji: { fontSize: 22 },
  serviceName: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  promoCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  promoTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  promoSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  storesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, marginBottom: spacing.lg },
  storeCard: {
    width: '50%',
    paddingHorizontal: GAP / 2,
    marginBottom: GAP,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  storeImage: { width: '100%', height: 72, backgroundColor: colors.gray50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  storeEmoji: { fontSize: 28 },
  storeName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  storeMeta: { fontSize: 11, color: colors.gray500 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, marginHorizontal: -GAP / 2 },
  quickLink: { width: '50%', paddingHorizontal: GAP / 2, marginBottom: GAP },
  quickLinkInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.gray100 },
  quickLinkFeatured: { borderColor: '#6C63FF', backgroundColor: '#f5f4ff' },
  quickLinkIcon: { fontSize: 20, marginRight: 10 },
  quickLinkBody: { flex: 1 },
  quickLinkText: { fontSize: 12, fontWeight: '600' },
  quickLinkDesc: { fontSize: 10, color: '#6C63FF', fontWeight: '600', marginTop: 2 },
  additionalGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, marginBottom: spacing.lg },
  additionalTile: {
    width: '50%',
    paddingHorizontal: GAP / 2,
    marginBottom: GAP,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  additionalIcon: { fontSize: 24, marginBottom: 6 },
  additionalLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  additionalDesc: { fontSize: 10, color: colors.gray500, lineHeight: 14 },
});
