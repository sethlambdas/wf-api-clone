import { Module } from '@nestjs/common';

import { ClientModule } from '../client/client.module';
import { IntegrationAppModule } from '../integration-app/integration-app.module';
import { DocuwareResolver } from './docuware.resolver';
import { DocuwareService } from './docuware.service';

@Module({
  imports: [ClientModule, IntegrationAppModule],
  providers: [DocuwareResolver, DocuwareService],
  exports: [DocuwareService],
})
export class DocuwareModule {}
