import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { OrganizationSchema } from '../organizations/organization.schema';
import { WorkflowExecutionSchema } from '../workflow-executions/workflow-execution.schema';
import { WorkflowStepExecutionHistorySchema } from '../workflow-steps-executions-history/workflow-steps-wxh.schema';
import { WorkflowStepSchema } from '../workflow-steps/workflow-step.schema';
import { WorkflowVersionSchema } from '../workflow-versions/workflow-version.schema';
import { WorkflowSchema } from '../workflow/workflow.schema';
import { SecondaryIndexes } from './schemas/secondary-index.schema';

const workflowModel = DynamooseModule.forFeature([
  {
    name: ConfigUtil.get('dynamodb.schema.workflow'),
    schema: [
      SecondaryIndexes,
      WorkflowSchema,
      WorkflowVersionSchema,
      WorkflowExecutionSchema,
      WorkflowStepSchema,
      WorkflowStepExecutionHistorySchema,
    ],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.workflowOrganization'),
    schema: [OrganizationSchema],
  },
]);

@Module({
  imports: [workflowModel],
  exports: [workflowModel],
})
export class DynamoDBModule {}
