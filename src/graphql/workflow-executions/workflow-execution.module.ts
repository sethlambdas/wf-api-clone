import { Module } from '@nestjs/common';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { WorkflowVersionModule } from '../workflow-versions/workflow-version.module';
import { WorkflowExecutionRepository } from './workflow-execution.repository';
import { WorkflowExecutionResolver } from './workflow-execution.resolver';
import { WorkflowExecutionService } from './workflow-execution.service';

@Module({
  imports: [DynamoDBModule, WorkflowVersionModule],
  providers: [WorkflowExecutionResolver, WorkflowExecutionService, WorkflowExecutionRepository],
  exports: [WorkflowExecutionService],
})
export class WorkflowExecutionModule {}
