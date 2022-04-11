import { Module } from '@nestjs/common';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { WorkflowExecutionModule } from '../workflow-executions/workflow-execution.module';
import { WorkflowVersionModule } from '../workflow-versions/workflow-version.module';
import { WorkflowModule } from '../workflow/workflow.module';

import { WorkflowStepExecutionHistoryRepository } from './workflow-steps-wxh.repository';
import { WorkflowStepExecutionHistoryResolver } from './workflow-steps-wxh.resolver';
import { WorkflowStepExecutionHistoryService } from './workflow-steps-wxh.service';

@Module({
  imports: [DynamoDBModule, WorkflowModule, WorkflowExecutionModule, WorkflowVersionModule],
  providers: [
    WorkflowStepExecutionHistoryResolver,
    WorkflowStepExecutionHistoryService,
    WorkflowStepExecutionHistoryRepository,
  ],
  exports: [WorkflowStepExecutionHistoryService],
})
export class WorkflowStepExecutionHistoryModule {}
