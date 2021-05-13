import { Module } from '@nestjs/common';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { OrganizationModule } from '../organizations/organization.module';
import { WorkflowExecutionModule } from '../workflow-executions/workflow-execution.module';
import { WorkflowStepModule } from '../workflow-steps/workflow-step.module';
import { WorkflowVersionModule } from '../workflow-versions/workflow-version.module';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowResolver } from './workflow.resolver';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [WorkflowStepModule, WorkflowVersionModule, WorkflowExecutionModule, OrganizationModule, DynamoDBModule],
  providers: [WorkflowResolver, WorkflowService, WorkflowRepository],
  exports: [WorkflowService],
})
export class WorkflowModule {}
