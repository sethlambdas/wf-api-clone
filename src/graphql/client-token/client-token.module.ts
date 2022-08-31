import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { ClientTokenRepository } from './client-token.repository';
import { ClientTokenResolver } from './client-token.resolver';
import { ClientTokenService } from './client-token.service';

@Module({
  imports: [DynamoDBModule],
  providers: [ClientTokenResolver, ClientTokenService, ClientTokenRepository],
  exports: [ClientTokenService],
})
export class ClientTokenModule {}
