import { Body, Controller, Param, Post } from '@nestjs/common';
import { IntegrationApp } from './integration-app.entity';
import { IntegrationAppRepository } from './integration-app.repository';

@Controller('integrationApp')
export class IntegrationAppController {
  constructor(private integrationAppRepository: IntegrationAppRepository) {}

  @Post('list')
  list(@Param() params: string[], @Body() payload: any): Promise<IntegrationApp[]> {
    return this.integrationAppRepository.listIntegrationApps(payload);
  }
}