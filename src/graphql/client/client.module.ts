import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { IntegrationAppModule } from '../integration-app/integration-app.module';
import { ClientRepository } from './client.repository';
import { ClientResolver } from './client.resolver';
import { ClientService } from './client.service';

@Module({
  imports: [DynamoDBModule, IntegrationAppModule],
  providers: [ClientResolver, ClientService, ClientRepository],
  exports: [ClientService],
})
export class ClientModule {}
