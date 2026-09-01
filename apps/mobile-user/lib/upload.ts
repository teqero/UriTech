import { apiFetch } from './api-fetch';

export interface PresignedUploadResult {
  url: string;
  key: string;
  bucket: string;
  publicUrl: string;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  bucket?: string,
): Promise<PresignedUploadResult> {
  const res = await apiFetch('/upload/presigned', {
    method: 'POST',
    body: JSON.stringify({ key, contentType, bucket }),
  });

  if (!res.ok) {
    let detail = 'Falha ao gerar URL de upload';
    try {
      const err = await res.json();
      if (err.message) detail = err.message;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  return res.json() as Promise<PresignedUploadResult>;
}

export async function uploadFileToPresignedUrl(
  presignedUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  // Ler o ficheiro local como blob/arraybuffer
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload falhou: ${uploadRes.status}`);
  }
}

export async function uploadLocalFile(
  fileUri: string,
  prefix: string,
  contentType: string,
  originalName?: string,
): Promise<{ publicUrl: string; key: string }> {
  const name = originalName || fileUri.split('/').pop() || 'file';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const key = `${prefix}/${timestamp}-${random}-${sanitized}`;

  const { url, publicUrl } = await getPresignedUploadUrl(key, contentType);
  await uploadFileToPresignedUrl(url, fileUri, contentType);

  return { publicUrl, key };
}
