import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';

@Controller('organization')
export class OrganizationController {
  constructor(private organizationRepository: OrganizationRepository) {}

  @Post('createApiKey')
  createApiKey(@Param() params: string[], @Body() payload: any) {
    return this.organizationRepository.createOrganizationApiKey(payload);
  }

  @Post('getApiKeyActive')
  getApiKeyActive(@Param() params: string[], @Body() payload: any) {
    return this.organizationRepository.getOrganizationApiKeyActive(payload);
  }
}
