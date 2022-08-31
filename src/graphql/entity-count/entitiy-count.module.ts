import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { EntityCountService } from './entitiy-count.service';
import { EntityCountRepository } from './entity-count.repository';

@Module({
  imports: [DynamoDBModule],
  providers: [EntityCountService, EntityCountRepository],
  exports: [EntityCountService],
})
export class EntityCountModule {}
