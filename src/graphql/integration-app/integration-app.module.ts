import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { EntityCountModule } from '../entity-count/entitiy-count.module';

import { IntegrationAppRepository } from './integration-app.repository';
import { IntegrationAppResolver } from './integration-app.resolver';
import { IntegrationAppService } from './integration-app.service';

@Module({
  imports: [DynamoDBModule, EntityCountModule],
  providers: [IntegrationAppResolver, IntegrationAppService, IntegrationAppRepository],
  exports: [IntegrationAppService],
})
export class IntegrationAppModule {}
