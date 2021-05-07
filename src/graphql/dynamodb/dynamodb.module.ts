import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { OrganizationSchema } from '../organizations/organization.schema';
import { WorkflowExecutionSchema } from '../workflow-executions/workflow-execution.schema';
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
      OrganizationSchema,
      WorkflowVersionSchema,
      WorkflowExecutionSchema,
      WorkflowStepSchema,
    ],
  },
]);

@Module({
  imports: [workflowModel],
  exports: [workflowModel],
})
export class DynamoDBModule {}
