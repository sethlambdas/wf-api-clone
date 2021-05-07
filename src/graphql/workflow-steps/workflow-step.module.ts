import { Module } from '@nestjs/common';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { WorkflowStepRepository } from './workflow-step.repository';
import { WorkflowStepResolver } from './workflow-step.resolver';
import { WorkflowStepService } from './workflow-step.service';

@Module({
  imports: [DynamoDBModule],
  providers: [WorkflowStepResolver, WorkflowStepService, WorkflowStepRepository],
  exports: [WorkflowStepService],
})
export class WorkflowStepModule {}
