import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { ClaimEvidenceService } from './claim-evidence.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';

@ApiTags('Claim Evidence')
@ApiBearerAuth('JWT-auth')
@Controller('claim-evidence')
export class ClaimEvidenceController {
  constructor(private claimEvidenceService: ClaimEvidenceService) {}

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar reclamações', description: 'Lista todas as reclamações e provas (admin only)' })
  @ApiQuery({ name: 'insurerId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de reclamações' })
  findAll(@Query('insurerId') insurerId?: string) {
    return this.claimEvidenceService.findAll(insurerId);
  }

  @Roles('admin')
  @Get('reference/:ref')
  @ApiOperation({ summary: 'Buscar por referência' })
  @ApiParam({ name: 'ref' })
  findByReference(@Param('ref') ref: string) {
    return this.claimEvidenceService.findByReference(ref);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da reclamação' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.claimEvidenceService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submeter reclamação', description: 'Submete nova reclamação com evidências' })
  @ApiBody({ type: SubmitClaimDto })
  @ApiResponse({ status: 201, description: 'Reclamação submetida' })
  submit(@Body() dto: SubmitClaimDto) {
    return this.claimEvidenceService.submit(dto);
  }
}
