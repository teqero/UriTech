import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadedFile {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly endpoint: string;
  private readonly publicUrlBase: string;

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const region = process.env.S3_REGION || 'us-east-1';
    const accessKey = process.env.S3_ACCESS_KEY || 'uritech';
    const secretKey = process.env.S3_SECRET_KEY || 'uritech123';

    this.s3 = new S3Client({
      region,
      endpoint: this.endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true, // Necessário para MinIO
    });

    // URL pública para aceder aos ficheiros
    this.publicUrlBase = process.env.S3_PUBLIC_URL || this.endpoint;
    this.logger.log(`Storage: ${this.endpoint} (public: ${this.publicUrlBase})`);
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
    bucket: string,
  ): Promise<UploadedFile> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      return {
        key,
        url: this.getPublicUrl(key, bucket),
        bucket,
        size: buffer.length,
        mimeType,
      };
    } catch (err) {
      this.logger.error(`Upload falhou: ${key}`, err instanceof Error ? err.message : err);
      throw new Error('Falha ao fazer upload do ficheiro');
    }
  }

  getPublicUrl(key: string, bucket: string): string {
    // Para MinIO com public bucket, retornamos URL directa
    // Se tivermos CDN/proxy, usamos S3_PUBLIC_URL
    return `${this.publicUrlBase}/${bucket}/${key}`;
  }

  async getSignedDownloadUrl(key: string, bucket: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getSignedUploadUrl(key: string, bucket: string, contentType: string, expiresIn = 300): Promise<string> {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      this.logger.log(`Ficheiro eliminado: ${bucket}/${key}`);
    } catch (err) {
      this.logger.error(`Delete falhou: ${key}`, err instanceof Error ? err.message : err);
      throw new Error('Falha ao eliminar ficheiro');
    }
  }

  generateKey(prefix: string, originalName: string): string {
    const timestamp = Date.now();
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}/${timestamp}-${random}-${sanitized}`;
  }

  async healthCheck(): Promise<void> {
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const bucket = process.env.S3_BUCKET || 'uritech-media';
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err: any) {
      if (err?.name === 'NotFound' || err?.name === 'NoSuchBucket' || err?.$metadata?.httpStatusCode === 404) {
        return;
      }
      throw err;
    }
  }
}
