import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ClaimEvidenceReport, Location } from '@uritech/shared';
import { generateClaimReference, generateIntegrityHash, URIPROVA_DEFAULT_LOCATION } from '@uritech/shared';
import { Repository } from 'typeorm';
import { ClaimEvidenceEntity } from '../database/entities/claim-evidence.entity';
import { InsurersService } from '../insurers/insurers.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';

@Injectable()
export class ClaimEvidenceService {
  private readonly logger = new Logger(ClaimEvidenceService.name);

  constructor(
    private insurersService: InsurersService,
    @InjectRepository(ClaimEvidenceEntity)
    private readonly claimsRepo: Repository<ClaimEvidenceEntity>,
  ) {}

  private toReport(row: ClaimEvidenceEntity): ClaimEvidenceReport {
    return {
      id: row.id,
      reference: row.reference,
      insurerId: row.insurerId,
      insurerName: row.insurerName,
      policyNumber: row.policyNumber,
      insuredName: row.insuredName,
      insuredPhone: row.insuredPhone,
      incidentType: row.incidentType,
      incidentDescription: row.incidentDescription,
      location: row.location,
      media: row.media,
      status: row.status,
      integrityHash: row.integrityHash,
      submittedAt: row.submittedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(insurerId?: string) {
    const rows = await this.claimsRepo.find({
      where: insurerId ? { insurerId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toReport(r));
  }

  async findById(id: string) {
    const row = await this.claimsRepo.findOne({ where: { id } });
    return row ? this.toReport(row) : undefined;
  }

  async findByReference(reference: string) {
    const row = await this.claimsRepo.findOne({ where: { reference } });
    return row ? this.toReport(row) : undefined;
  }

  private normalizeLocation(dto: SubmitClaimDto['location']): Location {
    return {
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address ?? URIPROVA_DEFAULT_LOCATION.address,
      city: dto.city ?? URIPROVA_DEFAULT_LOCATION.city,
      province: dto.province ?? URIPROVA_DEFAULT_LOCATION.province,
      country: dto.country ?? URIPROVA_DEFAULT_LOCATION.country,
    };
  }

  async submit(dto: SubmitClaimDto) {
    const insurer = await this.insurersService.findById(dto.insurerId);
    if (!insurer) throw new NotFoundException('Seguradora não encontrada');
    if (!insurer.active) throw new BadRequestException('Seguradora inactiva');
    if (!dto.media?.length) throw new BadRequestException('Inclua pelo menos uma evidência');

    const reference = generateClaimReference();
    const location = this.normalizeLocation(dto.location);
    const integrityHash = generateIntegrityHash([
      reference,
      dto.insurerId,
      dto.policyNumber,
      dto.incidentType,
      ...dto.media.map((m) => `${m.type}:${m.capturedAt}:${m.uri ?? ''}`),
    ]);

    const now = new Date();
    const report = await this.claimsRepo.save(
      this.claimsRepo.create({
        id: `clm-${Date.now()}`,
        reference,
        insurerId: dto.insurerId,
        insurerName: insurer.name,
        policyNumber: dto.policyNumber,
        insuredName: dto.insuredName,
        insuredPhone: dto.insuredPhone,
        incidentType: dto.incidentType,
        incidentDescription: dto.incidentDescription,
        location,
        media: dto.media,
        status: 'submitted',
        integrityHash,
        submittedAt: now,
      }),
    );

    await this.insurersService.incrementClaimCount(dto.insurerId);

    if (insurer.apiWebhookUrl) {
      void this.deliverWebhook(insurer.apiWebhookUrl, {
        reference,
        integrityHash,
        insurerCode: insurer.code,
        policyNumber: dto.policyNumber,
        insuredName: dto.insuredName,
        insuredPhone: dto.insuredPhone,
        incidentType: dto.incidentType,
        incidentDescription: dto.incidentDescription,
        location,
        media: dto.media.map((m) => ({
          id: m.id,
          type: m.type,
          label: m.label,
          capturedAt: m.capturedAt,
          latitude: m.latitude,
          longitude: m.longitude,
          durationSec: m.durationSec,
          url: m.uri,
        })),
        submittedAt: now.toISOString(),
      });
    }

    return {
      report: this.toReport(report),
      feeCharged: insurer.platformFeePerClaim,
      message: 'Evidências enviadas à seguradora com sucesso',
    };
  }

  private async deliverWebhook(url: string, payload: Record<string, unknown>) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-UriProva-Event': 'claim.submitted',
          'X-UriProva-Reference': String(payload.reference),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(`Webhook ${url} respondeu HTTP ${res.status}`);
        return;
      }
      this.logger.log(`Webhook entregue → ${url} (${payload.reference})`);
    } catch (err) {
      this.logger.error(`Webhook falhou → ${url}`, err instanceof Error ? err.message : err);
    }
  }
}
