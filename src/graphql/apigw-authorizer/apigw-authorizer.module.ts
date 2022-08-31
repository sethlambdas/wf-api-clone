import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { IntegrationAppModule } from '../integration-app/integration-app.module';
import { ApigwAuthorizerRepository } from './apigw-authorizer.repository';
import { ApigwAuthorizerResolver } from './apigw-authorizer.resolver';
import { ApigwAuthorizerService } from './apigw-authorizer.service';

@Module({
  imports: [DynamoDBModule, IntegrationAppModule],
  providers: [ApigwAuthorizerResolver, ApigwAuthorizerService, ApigwAuthorizerRepository],
})
export class ApigwAuthorizerModule {}
