import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesResolver } from './resources.resolver';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { ResourcesRepository } from './resources.repository';

@Module({
  imports: [DynamoDBModule],
  providers: [ResourcesService, ResourcesResolver, ResourcesRepository],
})
export class ResourcesModule {}
