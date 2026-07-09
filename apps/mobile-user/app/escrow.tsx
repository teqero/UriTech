import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, formatCurrency } from '@uritech/shared';

type EscrowStep = 'create' | 'code' | 'courier' | 'seller' | 'done';

const ESCROW_PURPLE = '#6C63FF';
const PRODUCT = 'Samsung Galaxy S24 Ultra';
const SELLER = 'Carlos Manuel';
const BUYER = 'Francisco Van-Dunem';
const AMOUNT = 450_000;
const FEE = 22_500;
const DELIVERY = 1_500;
const TOTAL = AMOUNT + FEE + DELIVERY;
const CONFIRM_CODE = '847293';

export default function EscrowScreen() {
  const [step, setStep] = useState<EscrowStep>('create');
  const [deliveryMode, setDeliveryMode] = useState<'urigo' | 'personal'>('urigo');
  const [paymentMethod, setPaymentMethod] = useState('Multicaixa Express');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  const codeValue = codeDigits.join('');

  const submitCode = () => {
    if (codeValue !== CONFIRM_CODE) {
      Alert.alert('Código inválido', 'Peça o código correcto ao comprador (demo: 847293).');
      return;
    }
    setStep('done');
  };

  const renderHeader = (title: string, badge?: string) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => (step === 'create' ? router.back() : setStep(
        step === 'code' ? 'create' : step === 'courier' || step === 'seller' ? 'code' : 'create',
      ))}>
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );

  if (step === 'done') {
    return (
      <View style={styles.container}>
        {renderHeader('Pagamento Libertado')}
        <View style={styles.doneBody}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>Escrow concluído</Text>
          <Text style={styles.doneSub}>
            {formatCurrency(AMOUNT)} libertados para {SELLER}.
            {deliveryMode === 'urigo' ? ` Comissão de entrega: ${formatCurrency(DELIVERY)}.` : ''}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)' as never)}>
            <Text style={styles.primaryBtnText}>VOLTAR AO INÍCIO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'code') {
    return (
      <View style={styles.container}>
        {renderHeader('Dispositivo do Comprador')}
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>O Seu Código de Confirmação</Text>
          <Text style={styles.hint}>Guarde este código — vai precisar dele para confirmar a recepção.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeBig}>{CONFIRM_CODE.slice(0, 3)}</Text>
            <Text style={styles.codeSep}>·</Text>
            <Text style={styles.codeBig}>{CONFIRM_CODE.slice(3)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{PRODUCT}</Text>
            <Text style={styles.cardSub}>Vendedor: {SELLER} · {formatCurrency(AMOUNT)}</Text>
          </View>
          <Text style={styles.sectionTitle}>Como usar o código</Text>
          <Text style={styles.hint}>
            {deliveryMode === 'urigo'
              ? 'Mostre ou diga o código ao estafeta para ele inserir no dispositivo dele.'
              : 'Mostre ou diga o código ao vendedor e ele insere no dispositivo dele.'}
          </Text>
          <Text style={styles.expire}>Código expira em: 04:59</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('WhatsApp', `Código SecurePay: ${CONFIRM_CODE}`)}>
            <Text style={styles.secondaryBtnText}>PARTILHAR POR WHATSAPP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep(deliveryMode === 'urigo' ? 'courier' : 'seller')}
          >
            <Text style={styles.primaryBtnText}>
              {deliveryMode === 'urigo' ? 'SIMULAR ENTREGADOR' : 'SIMULAR VENDEDOR'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.warn}>Não partilhe este código antes de receber a encomenda.</Text>
        </ScrollView>
      </View>
    );
  }

  if (step === 'courier' || step === 'seller') {
    const isCourier = step === 'courier';
    return (
      <View style={styles.container}>
        {renderHeader(
          isCourier ? 'Inserir Código do Comprador' : 'Inserir Código do Comprador',
          isCourier ? 'DISPOSITIVO DO ENTREGADOR' : 'DISPOSITIVO DO VENDEDOR',
        )}
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{PRODUCT}</Text>
            <Text style={styles.cardSub}>Comprador: {BUYER}</Text>
            <Text style={styles.cardSub}>
              {isCourier ? `Total: ${formatCurrency(TOTAL)} · Condomínio Kilamba Bloco B12` : formatCurrency(AMOUNT)}
            </Text>
          </View>
          <Text style={styles.hint}>
            {isCourier
              ? 'Peça ao comprador o código de confirmação e insira abaixo para libertar o pagamento.'
              : 'Peça ao comprador o código e entregue o dispositivo para ele inserir.'}
          </Text>
          <Text style={styles.sectionTitle}>Código de confirmação</Text>
          <View style={styles.digitRow}>
            {codeDigits.map((d, i) => (
              <TextInput
                key={i}
                style={styles.digit}
                value={d}
                maxLength={1}
                keyboardType="number-pad"
                onChangeText={(v) => {
                  const next = [...codeDigits];
                  next[i] = v.replace(/\D/g, '').slice(-1);
                  setCodeDigits(next);
                }}
              />
            ))}
          </View>
          {isCourier ? (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Pagamento ao Vendedor</Text>
              <Text style={styles.feeValue}>{formatCurrency(AMOUNT)}</Text>
              <Text style={styles.feeLabel}>Sua Comissão de Entrega</Text>
              <Text style={styles.feeValue}>{formatCurrency(DELIVERY)}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Após confirmação o pagamento de {formatCurrency(AMOUNT)} será libertado imediatamente.
            </Text>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={submitCode}>
            <Text style={styles.primaryBtnText}>CONFIRMAR RECEPÇÃO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Reportar', 'Problema reportado à equipa UriGo.')}>
            <Text style={styles.linkDanger}>Reportar Problema</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // step === create
  return (
    <View style={styles.container}>
      {renderHeader('Novo Pagamento Seguro')}
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{PRODUCT}</Text>
          <Text style={styles.cardSub}>Vendedor: {SELLER}</Text>
        </View>

        <Text style={styles.label}>Valor do Produto</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{formatCurrency(AMOUNT).replace(' Kz', '')}</Text>
          <Text style={styles.amountUnit}>Kz</Text>
        </View>

        <Text style={styles.sectionTitle}>Método de Entrega</Text>
        <TouchableOpacity
          style={[styles.option, deliveryMode === 'urigo' && styles.optionActive]}
          onPress={() => setDeliveryMode('urigo')}
        >
          <Text style={styles.optionTitle}>Com Entrega UriGo</Text>
          <Text style={styles.optionSub}>Taxa calculada automaticamente. Estafeta confirma.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, deliveryMode === 'personal' && styles.optionActive]}
          onPress={() => setDeliveryMode('personal')}
        >
          <Text style={styles.optionTitle}>Sem Entrega UriGo</Text>
          <Text style={styles.optionSub}>Confirmado via código no dispositivo do comprador.</Text>
        </TouchableOpacity>

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Taxa UriGo (5%)</Text>
          <Text style={styles.feeValue}>{formatCurrency(FEE)}</Text>
          {deliveryMode === 'urigo' ? (
            <>
              <Text style={styles.feeLabel}>Entrega</Text>
              <Text style={styles.feeValue}>{formatCurrency(DELIVERY)}</Text>
            </>
          ) : null}
          <Text style={[styles.feeLabel, styles.totalLabel]}>Total a Pagar</Text>
          <Text style={[styles.feeValue, styles.totalValue]}>
            {formatCurrency(deliveryMode === 'urigo' ? TOTAL : AMOUNT + FEE)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Pagar com</Text>
        <View style={styles.methods}>
          {['Multicaixa Express', 'PayPal', 'Unitel Money'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodChip, paymentMethod === m && styles.methodChipActive]}
              onPress={() => setPaymentMethod(m)}
            >
              <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.protect}>Fundos protegidos até confirmação</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('code')}>
          <Text style={styles.primaryBtnText}>DEPOSITAR NO ESCROW</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: {
    backgroundColor: ESCROW_PURPLE, paddingTop: 50, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center',
  },
  badge: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  label: { fontSize: 13, color: colors.gray500, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.xl, gap: 8 },
  amount: { fontSize: 36, fontWeight: '700', color: colors.black },
  amountUnit: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.gray500 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.sm },
  option: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.gray100,
  },
  optionActive: { borderColor: ESCROW_PURPLE, backgroundColor: '#F5F4FF' },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionSub: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  feeRow: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginVertical: spacing.md },
  feeLabel: { fontSize: 13, color: colors.gray500, marginTop: 6 },
  feeValue: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  totalLabel: { marginTop: spacing.md, color: colors.black, fontWeight: '700' },
  totalValue: { fontSize: 22, color: ESCROW_PURPLE },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  methodChip: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, borderColor: colors.gray100, backgroundColor: colors.white,
  },
  methodChipActive: { borderColor: ESCROW_PURPLE, backgroundColor: '#F5F4FF' },
  methodText: { fontSize: 12, fontWeight: '600', color: colors.gray500 },
  methodTextActive: { color: ESCROW_PURPLE },
  protect: { textAlign: 'center', fontSize: 12, color: colors.primary, marginBottom: spacing.md, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: ESCROW_PURPLE, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', marginBottom: spacing.md,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1, borderColor: ESCROW_PURPLE, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', marginBottom: spacing.md,
  },
  secondaryBtnText: { color: ESCROW_PURPLE, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  hint: { fontSize: 13, color: colors.gray500, lineHeight: 20, marginBottom: spacing.lg },
  codeBox: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg,
  },
  codeBig: { fontSize: 40, fontWeight: '700', color: ESCROW_PURPLE, letterSpacing: 4 },
  codeSep: { fontSize: 32, color: colors.gray300 },
  expire: { textAlign: 'center', fontSize: 13, color: colors.secondary, fontWeight: '700', marginBottom: spacing.lg },
  warn: { textAlign: 'center', fontSize: 12, color: colors.error, marginTop: spacing.md },
  digitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  digit: {
    width: 48, height: 56, borderRadius: 10, borderWidth: 1, borderColor: colors.gray100,
    backgroundColor: colors.white, textAlign: 'center', fontSize: 22, fontWeight: '700',
  },
  linkDanger: { textAlign: 'center', color: colors.error, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xl },
  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  doneIcon: { fontSize: 56, marginBottom: spacing.lg },
  doneTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  doneSub: { textAlign: 'center', color: colors.gray500, marginBottom: spacing.xl, lineHeight: 20 },
});
