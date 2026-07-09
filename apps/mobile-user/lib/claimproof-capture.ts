import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { URIPROVA_DEFAULT_LOCATION } from '@uritech/shared';
import type { Location as UriLocation } from '@uritech/shared';

export interface CaptureCoords {
  latitude: number;
  longitude: number;
}

export interface CaptureResult {
  uri: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
  durationSec?: number;
}

let activeRecording: Audio.Recording | null = null;

async function getCoords(): Promise<CaptureCoords> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== 'granted') {
        return {
          latitude: URIPROVA_DEFAULT_LOCATION.latitude,
          longitude: URIPROVA_DEFAULT_LOCATION.longitude,
        };
      }
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return {
      latitude: URIPROVA_DEFAULT_LOCATION.latitude,
      longitude: URIPROVA_DEFAULT_LOCATION.longitude,
    };
  }
}

export async function ensureCameraPermission(needsMic = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert('Use o telemóvel', 'A captura com câmara e GPS está disponível na app UriGo (Android/iOS).');
    return false;
  }

  const cam = await ImagePicker.requestCameraPermissionsAsync();
  if (!cam.granted) {
    Alert.alert('Câmara', 'Active o acesso à câmara nas definições para registar evidências.');
    return false;
  }

  if (needsMic) {
    const mic = await Audio.requestPermissionsAsync();
    if (!mic.granted) {
      Alert.alert('Microfone', 'Active o microfone para gravar vídeo ou áudio do sinistro.');
      return false;
    }
  }

  const loc = await Location.requestForegroundPermissionsAsync();
  if (loc.status !== 'granted') {
    Alert.alert(
      'GPS',
      'Sem localização GPS a evidência tem menor valor probatório. Pode continuar na mesma.',
    );
  }

  return true;
}

export async function capturePhotoEvidence(): Promise<CaptureResult | null> {
  if (!(await ensureCameraPermission(false))) return null;

  const coords = await getCoords();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    exif: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    capturedAt: new Date().toISOString(),
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export async function captureVideoEvidence(): Promise<CaptureResult | null> {
  if (!(await ensureCameraPermission(true))) return null;

  const coords = await getCoords();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: 60,
    quality: 0.75,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    capturedAt: new Date().toISOString(),
    latitude: coords.latitude,
    longitude: coords.longitude,
    durationSec: asset.duration ? Math.round(asset.duration / 1000) : undefined,
  };
}

export async function startAudioRecording(): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert('Indisponível', 'Gravação de áudio apenas na app móvel.');
    return false;
  }

  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Microfone', 'Active o acesso ao microfone nas definições.');
    return false;
  }

  await Location.requestForegroundPermissionsAsync();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  activeRecording = recording;
  return true;
}

export async function stopAudioRecording(): Promise<CaptureResult | null> {
  if (!activeRecording) return null;

  const recording = activeRecording;
  activeRecording = null;

  try {
    await recording.stopAndUnloadAsync();
  } catch {
    return null;
  }

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  if (!uri) return null;

  const status = await recording.getStatusAsync();
  const coords = await getCoords();

  return {
    uri,
    capturedAt: new Date().toISOString(),
    latitude: coords.latitude,
    longitude: coords.longitude,
    durationSec: Math.max(1, Math.round(status.durationMillis / 1000)),
  };
}

export function isAudioRecordingActive(): boolean {
  return activeRecording !== null;
}

export async function cancelAudioRecording(): Promise<void> {
  if (!activeRecording) return;
  try {
    await activeRecording.stopAndUnloadAsync();
  } catch {
    /* ignore */
  }
  activeRecording = null;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

export async function getIncidentLocation(): Promise<UriLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return URIPROVA_DEFAULT_LOCATION;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const places = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const geo = places[0];
    const address = geo
      ? [geo.street, geo.district, geo.name].filter(Boolean).join(', ')
      : URIPROVA_DEFAULT_LOCATION.address;

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      address: address || URIPROVA_DEFAULT_LOCATION.address,
      city: geo?.city ?? geo?.subregion ?? URIPROVA_DEFAULT_LOCATION.city,
      province: geo?.region ?? URIPROVA_DEFAULT_LOCATION.province,
      country: geo?.country ?? URIPROVA_DEFAULT_LOCATION.country,
    };
  } catch {
    return URIPROVA_DEFAULT_LOCATION;
  }
}
