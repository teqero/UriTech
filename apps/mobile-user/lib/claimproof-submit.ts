import type { ClaimMediaItem, ClaimEvidenceReport, IncidentType, Location } from '@uritech/shared';
import { URIPROVA_DEFAULT_LOCATION } from '@uritech/shared';
import { apiFetch } from './api-fetch';

const MAX_INLINE_BYTES = 8 * 1024 * 1024;

function mimeFor(type: ClaimMediaItem['type']): string {
  if (type === 'photo') return 'image/jpeg';
  if (type === 'video') return 'video/mp4';
  return 'audio/m4a';
}

async function readLocalFileAsBase64(uri: string): Promise<{ base64: string; size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const blob = xhr.response as Blob;
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve({ base64, size: blob.size });
      };
      reader.onerror = () => reject(new Error('Falha ao ler ficheiro'));
      reader.readAsDataURL(blob);
    };
    xhr.onerror = () => reject(new Error('Falha ao abrir ficheiro'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

export async function encodeMediaForSubmit(media: ClaimMediaItem[]): Promise<ClaimMediaItem[]> {
  const encoded: ClaimMediaItem[] = [];

  for (const item of media) {
    if (!item.uri || item.uri.startsWith('http')) {
      encoded.push(item);
      continue;
    }

    try {
      const { base64, size } = await readLocalFileAsBase64(item.uri);
      if (size > MAX_INLINE_BYTES) {
        encoded.push({ ...item, base64: undefined });
        continue;
      }
      encoded.push({
        ...item,
        base64: `data:${mimeFor(item.type)};base64,${base64}`,
      });
    } catch {
      encoded.push(item);
    }
  }

  return encoded;
}

export function normalizeIncidentLocation(location: Location): Location {
  return {
    ...URIPROVA_DEFAULT_LOCATION,
    ...location,
    country: location.country ?? URIPROVA_DEFAULT_LOCATION.country,
    address: location.address ?? URIPROVA_DEFAULT_LOCATION.address,
    city: location.city ?? URIPROVA_DEFAULT_LOCATION.city,
    province: location.province ?? URIPROVA_DEFAULT_LOCATION.province,
  };
}

export interface SubmitClaimPayload {
  insurerId: string;
  policyNumber: string;
  insuredName: string;
  insuredPhone: string;
  incidentType: IncidentType;
  incidentDescription?: string;
  location: Location;
  media: ClaimMediaItem[];
}

export async function submitClaimEvidence(
  payload: SubmitClaimPayload,
): Promise<{ report: ClaimEvidenceReport; message: string }> {
  const location = normalizeIncidentLocation(payload.location);
  const media = await encodeMediaForSubmit(payload.media);

  const res = await apiFetch('/claim-evidence', {
    method: 'POST',
    body: JSON.stringify({ ...payload, location, media }),
  });

  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const err = await res.json();
      if (Array.isArray(err.message)) detail = err.message.join(', ');
      else if (typeof err.message === 'string') detail = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  return res.json();
}
