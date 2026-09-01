import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator,
  Image, Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  colors, spacing, borderRadius, formatCurrency,
  URIPROVA_TAGLINE, URIPROVA_VALUE_PROPS, URIPROVA_CAPTURE_STEPS, INCIDENT_TYPES,
  DEMO_INSURERS, URIPROVA_DEFAULT_LOCATION,
  type Insurer, type ClaimMediaItem, type IncidentType, type ClaimEvidenceReport, type Location,
} from '@uritech/shared';
import {
  capturePhotoEvidence, captureVideoEvidence, startAudioRecording, stopAudioRecording,
  cancelAudioRecording, getIncidentLocation, isAudioRecordingActive,
} from '../lib/claimproof-capture';
import { checkApiHealth, getApiBaseUrl } from '../lib/api';
import { submitClaimEvidence } from '../lib/claimproof-submit';

type Step = 'intro' | 'policy' | 'incident' | 'capture' | 'review' | 'done';

function generateIntegrityHash(inputs: string[]): string {
  const joined = inputs.join('|');
  let hash = 0;
  for (let i = 0; i < joined.length; i++) {
    const char = joined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

export default function UriProvaScreen() {
  const [step, setStep] = useState<Step>('intro');
  const [insurers, setInsurers] = useState<Insurer[]>(DEMO_INSURERS);
  const [insurerId, setInsurerId] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insuredName, setInsuredName] = useState('');
  const [insuredPhone, setInsuredPhone] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('colisao');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<ClaimMediaItem[]>([]);
  const [incidentLocation, setIncidentLocation] = useState<Location>(URIPROVA_DEFAULT_LOCATION);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimEvidenceReport | null>(null);
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [audioModal, setAudioModal] = useState<{ stepId: string; label: string } | null>(null);
  const [audioRecording, setAudioRecording] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [apiStatus, setApiStatus] = useState<{ ok: boolean; url: string; message?: string } | null>(null);
  const audioTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiStatus);
    const apiUrl = getApiBaseUrl();
    fetch(`${apiUrl}/insurers?active=true`)
      .then((r) => (r.ok ? r.json() : DEMO_INSURERS))
      .then((data: Insurer[]) => { if (Array.isArray(data) && data.length) setInsurers(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 'capture') {
      getIncidentLocation().then(setIncidentLocation);
    }
  }, [step]);

  useEffect(() => () => {
    if (audioTimer.current) clearInterval(audioTimer.current);
    if (isAudioRecordingActive()) void cancelAudioRecording();
  }, []);

  const selectedInsurer = insurers.find((i) => i.id === insurerId);

  const saveCapture = useCallback((stepId: string, type: ClaimMediaItem['type'], label: string, capture: {
    uri: string; capturedAt: string; latitude: number; longitude: number; durationSec?: number;
  }) => {
    const item: ClaimMediaItem = {
      id: `${stepId}-${Date.now()}`,
      type,
      label,
      uri: capture.uri,
      capturedAt: capture.capturedAt,
      latitude: capture.latitude,
      longitude: capture.longitude,
      durationSec: capture.durationSec,
    };
    setMedia((prev) => [...prev.filter((m) => !m.id.startsWith(stepId)), item]);
  }, []);

  const handleCapture = useCallback(async (stepId: string, type: ClaimMediaItem['type'], label: string) => {
    if (type === 'audio') {
      setAudioModal({ stepId, label });
      return;
    }

    setCapturingId(stepId);
    try {
      const capture = type === 'video'
        ? await captureVideoEvidence()
        : await capturePhotoEvidence();

      if (!capture) return;

      saveCapture(stepId, type, label, capture);
      Alert.alert(
        'Evidência registada',
        `${label}\nGPS: ${capture.latitude.toFixed(5)}, ${capture.longitude.toFixed(5)}`,
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível capturar. Tente novamente.');
    } finally {
      setCapturingId(null);
    }
  }, [saveCapture]);

  const beginAudio = async () => {
    const ok = await startAudioRecording();
    if (!ok) return;
    setAudioRecording(true);
    setAudioSeconds(0);
    audioTimer.current = setInterval(() => setAudioSeconds((s) => s + 1), 1000);
  };

  const finishAudio = async () => {
    if (audioTimer.current) {
      clearInterval(audioTimer.current);
      audioTimer.current = null;
    }
    setAudioRecording(false);

    const capture = await stopAudioRecording();
    if (!capture || !audioModal) {
      setAudioModal(null);
      return;
    }

    saveCapture(audioModal.stepId, 'audio', audioModal.label, capture);
    Alert.alert('Áudio gravado', `${audioModal.label} — ${capture.durationSec ?? 0}s com GPS.`);
    setAudioModal(null);
    setAudioSeconds(0);
  };

  const cancelAudio = async () => {
    if (audioTimer.current) {
      clearInterval(audioTimer.current);
      audioTimer.current = null;
    }
    setAudioRecording(false);
    await cancelAudioRecording();
    setAudioModal(null);
    setAudioSeconds(0);
  };

  const handleSubmit = async () => {
    if (!insurerId || !policyNumber.trim() || media.length < 3) {
      Alert.alert('Incompleto', 'Seleccione a seguradora, apólice e capture pelo menos 3 evidências.');
      return;
    }
    setSubmitting(true);
    const location = await getIncidentLocation();
    setIncidentLocation(location);

    try {
      const data = await submitClaimEvidence({
        insurerId,
        policyNumber: policyNumber.trim(),
        insuredName: insuredName.trim() || 'Segurado UriGo',
        insuredPhone: insuredPhone.trim() || '+244900000000',
        incidentType,
        incidentDescription: description.trim() || undefined,
        location,
        media,
      });
      setResult(data.report);
      setStep('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no envio';
      const apiUrl = getApiBaseUrl();
      Alert.alert(
        'Não foi possível enviar',
        `${msg}\n\nAPI: ${apiUrl}\n\nConfirme que o backend está activo (porta 4000) e, no telemóvel USB, execute:\nadb reverse tcp:4000 tcp:4000`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = (title: string) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => (step === 'intro' ? router.back() : setStep(
        step === 'policy' ? 'intro' : step === 'incident' ? 'policy' : step === 'capture' ? 'incident' : step === 'review' ? 'capture' : 'intro',
      ))}>
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const audioModalView = (
    <Modal visible={!!audioModal} transparent animationType="slide" onRequestClose={cancelAudio}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{audioModal?.label}</Text>
          <Text style={styles.modalSub}>Descreva o que aconteceu. A gravação inclui GPS e hora.</Text>
          <View style={styles.audioPulse}>
            <Ionicons name="mic" size={40} color={audioRecording ? '#D32F2F' : '#0D47A1'} />
            <Text style={styles.audioTimer}>
              {String(Math.floor(audioSeconds / 60)).padStart(2, '0')}:
              {String(audioSeconds % 60).padStart(2, '0')}
            </Text>
          </View>
          {!audioRecording ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={beginAudio}>
              <Text style={styles.primaryBtnText}>INICIAR GRAVAÇÃO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#D32F2F' }]} onPress={finishAudio}>
              <Text style={styles.primaryBtnText}>PARAR E GUARDAR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelAudio}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (step === 'intro') {
    return (
      <View style={styles.container}>
        {renderHeader('UriProva')}
        <ScrollView style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>📋</Text>
            <Text style={styles.heroTitle}>Evidências de Sinistro</Text>
            <Text style={styles.heroSub}>{URIPROVA_TAGLINE}</Text>
          </View>
          <Text style={styles.sectionTitle}>Porquê usar?</Text>
          {URIPROVA_VALUE_PROPS.map((prop) => (
            <View key={prop} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={18} color="#0D47A1" />
              <Text style={styles.bulletText}>{prop}</Text>
            </View>
          ))}
          {Platform.OS !== 'web' ? (
            <View style={styles.gpsBanner}>
              <Ionicons name="location" size={16} color="#0D47A1" />
              <Text style={styles.gpsBannerText}>Câmara, microfone e GPS activos em cada captura</Text>
            </View>
          ) : null}
          {apiStatus ? (
            <View style={[styles.gpsBanner, { backgroundColor: apiStatus.ok ? '#E8F5E9' : '#FFEBEE', marginTop: spacing.sm }]}>
              <Ionicons name={apiStatus.ok ? 'cloud-done' : 'cloud-offline'} size={16} color={apiStatus.ok ? '#2E7D32' : '#C62828'} />
              <Text style={[styles.gpsBannerText, { color: apiStatus.ok ? '#2E7D32' : '#C62828', flex: 1 }]}>
                {apiStatus.ok ? `Servidor ligado — ${apiStatus.url}` : `Sem servidor — ${apiStatus.message ?? 'inicie o backend'}`}
              </Text>
            </View>
          ) : null}
          <Text style={styles.feeNote}>
            Seguradoras parceiras pagam taxa de plataforma — os segurados usam gratuitamente.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('policy')}>
            <Text style={styles.primaryBtnText}>REPORTAR SINISTRO AGORA</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'policy') {
    return (
      <View style={styles.container}>
        {renderHeader('Apólice')}
        <ScrollView style={styles.content}>
          <Text style={styles.label}>Seguradora *</Text>
          {insurers.filter((i) => i.active).map((ins) => (
            <TouchableOpacity
              key={ins.id}
              style={[styles.insurerCard, insurerId === ins.id && styles.insurerCardActive]}
              onPress={() => setInsurerId(ins.id)}
            >
              <Text style={styles.insurerName}>{ins.name}</Text>
              {ins.mandatedForClients ? <Text style={styles.mandatoryBadge}>Uso obrigatório</Text> : null}
            </TouchableOpacity>
          ))}
          <Text style={styles.label}>Nº da apólice *</Text>
          <TextInput style={styles.input} value={policyNumber} onChangeText={setPolicyNumber} placeholder="Ex: AP-2024-123456" />
          <Text style={styles.label}>Nome do segurado</Text>
          <TextInput style={styles.input} value={insuredName} onChangeText={setInsuredName} placeholder="Nome completo" />
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={styles.input} value={insuredPhone} onChangeText={setInsuredPhone} placeholder="+244 9XX XXX XXX" keyboardType="phone-pad" />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('incident')} disabled={!insurerId || !policyNumber.trim()}>
            <Text style={styles.primaryBtnText}>CONTINUAR</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'incident') {
    return (
      <View style={styles.container}>
        {renderHeader('Tipo de sinistro')}
        <ScrollView style={styles.content}>
          <View style={styles.incidentGrid}>
            {INCIDENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.incidentCard, incidentType === t.value && styles.incidentCardActive]}
                onPress={() => setIncidentType(t.value)}
              >
                <Text style={{ fontSize: 28 }}>{t.icon}</Text>
                <Text style={styles.incidentLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Descrição breve</Text>
          <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="O que aconteceu?" />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('capture')}>
            <Text style={styles.primaryBtnText}>CAPTURAR EVIDÊNCIAS</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'capture') {
    return (
      <View style={styles.container}>
        {renderHeader('Captura')}
        {audioModalView}
        <ScrollView style={styles.content}>
          <View style={styles.gpsBanner}>
            <Ionicons name="location" size={16} color="#0D47A1" />
            <Text style={styles.gpsBannerText}>
              Local: {incidentLocation.address} ({incidentLocation.latitude.toFixed(4)}, {incidentLocation.longitude.toFixed(4)})
            </Text>
          </View>
          <Text style={styles.captureHint}>Toque no botão para abrir a câmara ou gravar áudio. Envio directo à {selectedInsurer?.name ?? 'seguradora'}.</Text>
          {URIPROVA_CAPTURE_STEPS.map((s) => {
            const captured = media.find((m) => m.id.startsWith(s.id));
            const busy = capturingId === s.id;
            return (
              <View key={s.id} style={styles.captureCard}>
                {captured?.type === 'photo' && captured.uri ? (
                  <Image source={{ uri: captured.uri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons
                      name={s.type === 'audio' ? 'mic' : s.type === 'video' ? 'videocam' : 'image'}
                      size={22}
                      color={colors.gray500}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.captureLabel}>{s.label}</Text>
                  <Text style={styles.captureSub}>{s.hint}</Text>
                  {captured ? (
                    <Text style={styles.capturedOk}>
                      ✓ {new Date(captured.capturedAt).toLocaleTimeString('pt-AO')}
                      {captured.durationSec ? ` · ${captured.durationSec}s` : ''}
                      {' · GPS'}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[styles.captureBtn, captured && styles.captureBtnDone]}
                  onPress={() => handleCapture(s.id, s.type, s.label)}
                  disabled={busy || !!capturingId}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Ionicons name={s.type === 'audio' ? 'mic' : s.type === 'video' ? 'videocam' : 'camera'} size={22} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
          <Text style={styles.progressText}>{media.length} / {URIPROVA_CAPTURE_STEPS.length} evidências</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('review')} disabled={media.length < 3}>
            <Text style={styles.primaryBtnText}>REVISAR E ENVIAR</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'review') {
    const hash = generateIntegrityHash(media.map((m) => `${m.type}:${m.capturedAt}:${m.uri ?? ''}`));
    return (
      <View style={styles.container}>
        {renderHeader('Confirmar')}
        <ScrollView style={styles.content}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Seguradora:</Text> {selectedInsurer?.name}</Text>
            <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Apólice:</Text> {policyNumber}</Text>
            <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Local GPS:</Text> {incidentLocation.address}</Text>
            <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Evidências:</Text> {media.length} ficheiros reais</Text>
            <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Integridade:</Text> {hash}</Text>
            {selectedInsurer ? (
              <Text style={styles.feeNote}>Taxa plataforma: {formatCurrency(selectedInsurer.platformFeePerClaim)} (cobrada à seguradora)</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>ENVIAR À SEGURADORA</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader('Enviado')}
      <ScrollView style={styles.content}>
        <View style={styles.successBox}>
          <Ionicons name="shield-checkmark" size={48} color="#0D47A1" />
          <Text style={styles.successTitle}>Evidências enviadas</Text>
          <Text style={styles.successRef}>Ref: {result?.reference}</Text>
          <Text style={styles.successHash}>Hash: {result?.integrityHash}</Text>
          <Text style={styles.successSub}>A {result?.insurerName} recebeu o dossiê digital com ficheiros e GPS. Guarde esta referência.</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: '#0D47A1', paddingTop: 50, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: spacing.xl },
  hero: { backgroundColor: '#E3F2FD', borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.xl, alignItems: 'center' },
  heroIcon: { fontSize: 48 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#0D47A1', marginTop: 8 },
  heroSub: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  gpsBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E3F2FD', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  gpsBannerText: { flex: 1, fontSize: 11, color: '#0D47A1' },
  feeNote: { fontSize: 11, color: colors.gray500, marginVertical: spacing.lg, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#0D47A1', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  cancelBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.md },
  cancelBtnText: { color: colors.gray500, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.gray100, fontSize: 15 },
  insurerCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  insurerCardActive: { borderColor: '#0D47A1', backgroundColor: '#E3F2FD' },
  insurerName: { fontWeight: '600', fontSize: 14 },
  mandatoryBadge: { fontSize: 10, color: '#F06400', fontWeight: '700', marginTop: 4 },
  incidentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  incidentCard: { width: '47%', backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  incidentCardActive: { borderColor: '#0D47A1' },
  incidentLabel: { fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  captureHint: { fontSize: 13, color: colors.gray500, marginBottom: spacing.lg },
  captureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, gap: 10 },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  captureLabel: { fontWeight: '600', fontSize: 14 },
  captureSub: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  capturedOk: { fontSize: 10, color: '#0D47A1', marginTop: 4, fontWeight: '600' },
  captureBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0D47A1', alignItems: 'center', justifyContent: 'center' },
  captureBtnDone: { backgroundColor: colors.primary },
  progressText: { textAlign: 'center', fontSize: 12, color: colors.gray500, marginTop: spacing.md },
  reviewCard: { backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg },
  reviewRow: { fontSize: 14, marginBottom: 8 },
  reviewKey: { fontWeight: '700' },
  successBox: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.white, borderRadius: borderRadius.lg },
  successTitle: { fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  successRef: { fontSize: 16, fontWeight: '600', color: '#0D47A1', marginTop: 8 },
  successHash: { fontSize: 11, color: colors.gray500, marginTop: 4, fontFamily: 'monospace' },
  successSub: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.xl, paddingBottom: spacing['3xl'] },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalSub: { fontSize: 13, color: colors.gray500, textAlign: 'center', marginTop: 8, marginBottom: spacing.xl },
  audioPulse: { alignItems: 'center', marginBottom: spacing.xl },
  audioTimer: { fontSize: 28, fontWeight: '700', marginTop: spacing.md, color: '#0D47A1' },
});
