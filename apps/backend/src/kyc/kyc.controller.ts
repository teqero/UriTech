import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  ForbiddenException,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { KycThrottlerGuard } from '../common/guards/kyc-throttler.guard';

/** Tipo local para ficheiros upload — evita dependência de @types/multer */
interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const KYC_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const KYC_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly storage: StorageService,
  ) {}

  @Get('limits')
  @ApiOperation({ summary: 'Limites por Tier', description: 'Lista todos os limites de transação por tier KYC' })
  @ApiResponse({ status: 200, description: 'Limites retornados com sucesso' })
  getLimits() {
    return this.kycService.getAllLimits();
  }

  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Meu status KYC', description: 'Retorna o estado e limites KYC do utilizador autenticado' })
  @ApiResponse({ status: 200, description: 'Status KYC retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getMyKycStatus(@CurrentUser('sub') userId: string) {
    return this.kycService.getUserKycStatus(userId);
  }

  @Post('submit')
  @UseGuards(KycThrottlerGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submeter KYC', description: 'Envia documentos para verificação de identidade' })
  @ApiBody({ type: SubmitKycDto })
  @ApiResponse({ status: 201, description: 'Documentos submetidos com sucesso' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido — máximo 3 submissões por hora' })
  async submitKyc(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    await this.kycService.submitKyc(userId, dto);
    return {
      success: true,
      message: 'Documentos submetidos com sucesso. A verificação pode levar até 24 horas.',
    };
  }

  @Post('renew')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Renovar KYC', description: 'Re-submete documentos para renovação de KYC expirado, rejeitado ou upgrade' })
  @ApiBody({ type: SubmitKycDto })
  @ApiResponse({ status: 201, description: 'Renovação submetida com sucesso' })
  @ApiResponse({ status: 400, description: 'Payload inválido ou estado não permite renovação' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async renewKyc(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    await this.kycService.renewKyc(userId, dto);
    return {
      success: true,
      message: 'Renovação de KYC submetida com sucesso. A verificação pode levar até 24 horas.',
    };
  }

  @Post('upload-document')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload documento KYC', description: 'Faz upload de um documento KYC (frente, verso ou selfie). Apenas imagens JPEG/PNG/WebP até 5MB.' })
  @ApiResponse({ status: 201, description: 'Ficheiro enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Ficheiro inválido, demasiado grande ou tipo não permitido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadKycDocument(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: UploadedFileInfo,
  ) {
    if (!file) {
      throw new BadRequestException('Ficheiro em falta');
    }
    if (file.size > KYC_MAX_FILE_SIZE) {
      throw new BadRequestException(`Ficheiro demasiado grande (máx: ${KYC_MAX_FILE_SIZE / 1024 / 1024} MB)`);
    }
    if (!KYC_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de ficheiro não permitido: ${file.mimetype}. Apenas JPEG, PNG e WebP.`);
    }

    const key = this.storage.generateKey(`kyc/${userId}`, file.originalname);
    const result = await this.storage.uploadFile(file.buffer, key, file.mimetype, 'uritech-kyc');

    return {
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
      mimeType: result.mimeType,
    };
  }

  // ── Admin endpoints ──

  @Get('admin/pending')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar KYCs pendentes', description: 'Admin: lista todos os KYCs pendentes de aprovação com paginação' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 20)' })
  @ApiResponse({ status: 200, description: 'Lista de KYCs pendentes' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado — requer role admin' })
  async getPendingKycs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.kycService.findPendingKycs(page, limit);
  }

  @Put('admin/:userId/approve')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Aprovar KYC', description: 'Admin: aprova KYC de um utilizador' })
  @ApiBody({ type: ApproveKycDto })
  @ApiResponse({ status: 200, description: 'KYC aprovado com sucesso' })
  @ApiResponse({ status: 400, description: 'Não há submissão pendente para este utilizador' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado — requer role admin' })
  async approveKyc(
    @CurrentUser('sub') adminId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: ApproveKycDto,
  ) {
    await this.kycService.approveKyc(userId, adminId, body.tier || 'verified');
    return {
      success: true,
      message: 'KYC aprovado com sucesso.',
    };
  }

  @Put('admin/:userId/reject')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rejeitar KYC', description: 'Admin: rejeita KYC de um utilizador' })
  @ApiBody({ type: RejectKycDto })
  @ApiResponse({ status: 200, description: 'KYC rejeitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Razão da rejeição é obrigatória' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado — requer role admin' })
  async rejectKyc(
    @CurrentUser('sub') adminId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: RejectKycDto,
  ) {
    if (!body.reason) {
      throw new ForbiddenException('Razão da rejeição é obrigatória');
    }
    await this.kycService.rejectKyc(userId, adminId, body.reason);
    return {
      success: true,
      message: 'KYC rejeitado.',
    };
  }
}
