import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

/** Tipo local para ficheiros upload — evita dependência de @types/multer */
interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'application/pdf',
];

@Controller('upload')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: UploadedFileInfo) {
    return this.handleUpload(file, 'avatars', 'uritech-media');
  }

  @Post('claim')
  @UseInterceptors(FileInterceptor('file'))
  async uploadClaimEvidence(@UploadedFile() file: UploadedFileInfo) {
    return this.handleUpload(file, 'claims', 'uritech-claims');
  }

  @Post('vendor-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVendorLogo(@UploadedFile() file: UploadedFileInfo) {
    return this.handleUpload(file, 'vendors', 'uritech-media');
  }

  @Post('presigned')
  async getPresignedUrl(
    @Body() body: { key: string; contentType: string; bucket?: string },
  ) {
    const bucket = body.bucket || 'uritech-media';
    const key = body.key || this.storage.generateKey('uploads', 'file.bin');
    const url = await this.storage.getSignedUploadUrl(key, bucket, body.contentType);
    return { url, key, bucket, publicUrl: this.storage.getPublicUrl(key, bucket) };
  }

  private async handleUpload(
    file: UploadedFileInfo | undefined,
    prefix: string,
    bucket: string,
  ) {
    if (!file) throw new BadRequestException('Ficheiro em falta');
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`Ficheiro demasiado grande (máx: ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de ficheiro não permitido: ${file.mimetype}`);
    }

    const key = this.storage.generateKey(prefix, file.originalname);
    const result = await this.storage.uploadFile(file.buffer, key, file.mimetype, bucket);

    return {
      url: result.url,
      key: result.key,
      size: result.size,
      mimeType: result.mimeType,
    };
  }
}
