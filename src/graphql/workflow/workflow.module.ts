import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../graphql/payments/payments.module';

import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { OrganizationModule } from '../organizations/organization.module';
import { WorkflowExecutionModule } from '../workflow-executions/workflow-execution.module';
import { WorkflowStepModule } from '../workflow-steps/workflow-step.module';
import { WorkflowVersionModule } from '../workflow-versions/workflow-version.module';

import { WorkflowController } from './workflow.controller';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowResolver } from './workflow.resolver';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    WorkflowStepModule,
    WorkflowVersionModule,
    WorkflowExecutionModule,
    OrganizationModule,
    DynamoDBModule,
    PaymentsModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowResolver, WorkflowService, WorkflowRepository],
  exports: [WorkflowService],
})
export class WorkflowModule {}
