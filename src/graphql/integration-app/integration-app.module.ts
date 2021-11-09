import { Module } from '@nestjs/common';
import { IntegrationAppController } from './integration-app.controller';
import { IntegrationAppRepository } from './integration-app.repository';

@Module({
  controllers: [IntegrationAppController],
  providers: [IntegrationAppRepository],
})
export class IntegrationAppModule {}
