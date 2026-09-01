import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, useColorScheme, TextInput, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';
import { fetchSocialPayment, paySocialProduct, prepareSocialCheckout, PLATFORM_ICONS, proxyImageUrl } from '../../lib/social-payments-api';

type DeliveryOption = 'pickup' | 'urigo' | 'none';

const DELIVERY_OPTIONS: { id: DeliveryOption; label: string; fee: number; icon: string }[] = [
  { id: 'pickup', label: 'Recolha directa', fee: 0, icon: '🤝' },
  { id: 'urigo', label: 'Entrega UriGo', fee: 1500, icon: '🚚' },
  { id: 'none', label: 'Digital / Sem entrega', fee: 0, icon: '📱' },
];

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [product, setProduct] = useState<Awaited<ReturnType<typeof fetchSocialPayment>> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryOption>('urigo');
  const [coupon, setCoupon] = useState('');
  const [payMethod, setPayMethod] = useState<'wallet' | 'multicaixa'>('wallet');

  const bg = dark ? '#0f0f12' : colors.gray50;
  const card = dark ? '#1a1a22' : colors.white;
  const text = dark ? colors.white : colors.black;
  const muted = dark ? '#9ca3af' : colors.gray500;

  const subtotal = (product?.price ?? 0) * quantity;
  const deliveryFee = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.fee ?? 0;
  const serviceFee = Math.round(subtotal * 0.025);
  const discount = coupon.toUpperCase() === 'URIGO10' ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  const refreshCheckout = useCallback(async () => {
    if (!id) return;
    try {
      const updated = await prepareSocialCheckout(id, { quantity, deliveryOption: delivery, couponCode: coupon || undefined });
      setProduct(updated);
    } catch {
      /* preview local */
    }
  }, [id, quantity, delivery, coupon]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setProduct(await fetchSocialPayment(id));
      await refreshCheckout();
    } finally {
      setLoading(false);
    }
  }, [id, refreshCheckout]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!loading && product) void refreshCheckout();
  }, [quantity, delivery, coupon, loading, product, refreshCheckout]);

  const handlePay = async () => {
    if (!id) return;
    setPaying(true);
    try {
      const receipt = await paySocialProduct(id, {
        quantity,
        deliveryOption: delivery,
        couponCode: coupon || undefined,
        payWithWallet: payMethod === 'wallet',
      });
      router.replace({
        pathname: '/pagar-produto/sucesso',
        params: {
          id,
          ref: receipt.receiptCode,
          total: String(receipt.payment.total),
          title: receipt.payment.title,
        },
      } as never);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Pagamento falhou');
    } finally {
      setPaying(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout UriPay</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.productRow, { backgroundColor: card }]}>
          {product.images[0] ? (
            <Image source={{ uri: proxyImageUrl(product.images[0]) }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}><Text style={{ fontSize: 28 }}>{PLATFORM_ICONS[product.platform] ?? '🛒'}</Text></View>
          )}
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { color: text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: muted }]}>Quantidade</Text>
        <View style={[styles.qtyRow, { backgroundColor: card }]}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={20} color={text} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: text }]}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(99, q + 1))}>
            <Ionicons name="add" size={20} color={text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.section, { color: muted }]}>Entrega</Text>
        {DELIVERY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.optionCard, { backgroundColor: card }, delivery === opt.id && styles.optionSelected]}
            onPress={() => setDelivery(opt.id)}
          >
            <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, { color: text }]}>{opt.label}</Text>
              <Text style={[styles.optionFee, { color: muted }]}>
                {opt.fee > 0 ? formatCurrency(opt.fee) : 'Grátis'}
              </Text>
            </View>
            <Ionicons
              name={delivery === opt.id ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color="#6C63FF"
            />
          </TouchableOpacity>
        ))}

        <Text style={[styles.section, { color: muted }]}>Cupão</Text>
        <View style={[styles.couponRow, { backgroundColor: card }]}>
          <TextInput
            style={[styles.couponInput, { color: text }]}
            placeholder="Código promocional (ex: URIGO10)"
            placeholderTextColor={muted}
            value={coupon}
            onChangeText={setCoupon}
            autoCapitalize="characters"
          />
        </View>

        <Text style={[styles.section, { color: muted }]}>Método de pagamento</Text>
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: card }, payMethod === 'wallet' && styles.optionSelected]}
          onPress={() => setPayMethod('wallet')}
        >
          <Ionicons name="wallet" size={24} color="#6C63FF" />
          <Text style={[styles.optionLabel, { color: text, flex: 1, marginLeft: 12 }]}>UriPay Wallet</Text>
          <Ionicons name={payMethod === 'wallet' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color="#6C63FF" />
        </TouchableOpacity>

        <View style={[styles.summary, { backgroundColor: card }]}>
          <Text style={[styles.summaryTitle, { color: text }]}>Resumo</Text>
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} dark={dark} />
          <SummaryRow label="Entrega" value={formatCurrency(deliveryFee)} dark={dark} />
          <SummaryRow label="Taxa UriPay (2.5%)" value={formatCurrency(serviceFee)} dark={dark} />
          {discount > 0 ? <SummaryRow label="Desconto" value={`-${formatCurrency(discount)}`} dark={dark} accent /> : null}
          <View style={styles.divider} />
          <SummaryRow label="Total" value={formatCurrency(total)} dark={dark} bold />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: card, borderTopColor: dark ? '#333' : colors.gray100 }]}>
        <TouchableOpacity style={styles.payBtn} onPress={() => void handlePay()} disabled={paying}>
          {paying ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.payBtnText}>PAGAR {formatCurrency(total)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({
  label, value, dark, bold, accent,
}: { label: string; value: string; dark: boolean; bold?: boolean; accent?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: dark ? '#9ca3af' : colors.gray500 }]}>{label}</Text>
      <Text style={[
        styles.summaryValue,
        { color: accent ? colors.primary : dark ? colors.white : colors.black },
        bold && { fontSize: 18, fontWeight: '800' },
      ]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#6C63FF', paddingTop: 50, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1, padding: spacing.xl },
  productRow: { flexDirection: 'row', gap: 14, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  thumb: { width: 72, height: 72, borderRadius: borderRadius.md },
  thumbPlaceholder: { width: 72, height: 72, borderRadius: borderRadius.md, backgroundColor: colors.gray50, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#6C63FF' },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 20, fontWeight: '800', marginHorizontal: spacing.xl },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'transparent',
  },
  optionSelected: { borderColor: '#6C63FF', backgroundColor: '#EEEDFF22' },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionFee: { fontSize: 12, marginTop: 2 },
  couponRow: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  couponInput: { fontSize: 15 },
  summary: { borderRadius: borderRadius.xl, padding: spacing.xl, marginTop: spacing.md },
  summaryTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.sm },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, borderTopWidth: 1 },
  payBtn: { backgroundColor: '#6C63FF', borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
  payBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
