import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { ClaimEvidenceService } from './claim-evidence.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';

@Controller('claim-evidence')
export class ClaimEvidenceController {
  constructor(private claimEvidenceService: ClaimEvidenceService) {}

  @Roles('admin')
  @Get()
  findAll(@Query('insurerId') insurerId?: string) {
    return this.claimEvidenceService.findAll(insurerId);
  }

  @Roles('admin')
  @Get('reference/:ref')
  findByReference(@Param('ref') ref: string) {
    return this.claimEvidenceService.findByReference(ref);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimEvidenceService.findById(id);
  }

  @Post()
  submit(@Body() dto: SubmitClaimDto) {
    return this.claimEvidenceService.submit(dto);
  }
}
