import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { WorkflowExecutionSchema } from '../workflow-executions/workflow-execution.schema';
import { WorkflowStepExecutionHistorySchema } from '../workflow-steps-executions-history/workflow-steps-wxh.schema';
import { WorkflowStepSchema } from '../workflow-steps/workflow-step.schema';
import { WorkflowVersionSchema } from '../workflow-versions/workflow-version.schema';
import { WorkflowSchema } from '../workflow/workflow.schema';
import { workflowSecondaryIndexes, workflowVersionsSecondaryIndexes, workflowExecutionsSecondaryIndexes } from './schemas/secondary-index.schema';

const workflowModel = DynamooseModule.forFeature([
  {
    name: ConfigUtil.get('dynamodb.schema.workflow'),
    schema: [
      workflowSecondaryIndexes,
      WorkflowSchema,
    ],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.workflowVersions'),
    schema: [
      workflowVersionsSecondaryIndexes,
      WorkflowVersionSchema,
      WorkflowStepSchema,
    ],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.workflowExecutions'),
    schema: [
      workflowExecutionsSecondaryIndexes,
      WorkflowExecutionSchema,
      WorkflowStepExecutionHistorySchema,
    ],
  },
]);

@Module({
  imports: [workflowModel],
  exports: [workflowModel],
})
export class DynamoDBModule {}
