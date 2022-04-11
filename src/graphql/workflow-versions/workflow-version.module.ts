import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { WorkflowStepModule } from '../workflow-steps/workflow-step.module';
import { WorkflowVersionRepository } from './workflow-version.repository';
import { WorkflowVersionResolver } from './workflow-version.resolver';
import { WorkflowVersionService } from './workflow-version.service';

@Module({
  imports: [DynamoDBModule, WorkflowStepModule],
  providers: [WorkflowVersionResolver, WorkflowVersionService, WorkflowVersionRepository],
  exports: [WorkflowVersionService],
})
export class WorkflowVersionModule {}
