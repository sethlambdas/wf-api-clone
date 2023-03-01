import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { WorkflowExecutionSchema } from '../workflow-executions/workflow-execution.schema';
import { WorkflowStepExecutionHistorySchema } from '../workflow-steps-executions-history/workflow-steps-wxh.schema';
import { WorkflowStepSchema } from '../workflow-steps/workflow-step.schema';
import { WorkflowVersionSchema } from '../workflow-versions/workflow-version.schema';
import { WorkflowSchema } from '../workflow/workflow.schema';
import {
  workflowSecondaryIndexes,
  workflowVersionsSecondaryIndexes,
  workflowExecutionsSecondaryIndexes,
} from './schemas/secondary-index.schema';
import { IntegrationAppsSchema } from '../integration-app/integration-app.schema';
import { ApigwAuthorizerSchema } from '../apigw-authorizer/apigw-authorizer.schema';
import { ClientTokenSchema } from '../client-token/client-token.schema';
import { ClientSchema } from '../client/client.schema';
import { EntityCountSchema } from '../entity-count/entitiy-count.schema';
import { UserSchema } from '../users/user.schema';
import { OrganizationSchema } from '../organizations/organization.schema';
import { ResourcesSchema } from '../resources/resources.schema';

const workflowModel = DynamooseModule.forFeature([
  {
    name: ConfigUtil.get('dynamodb.schema.workflow'),
    schema: [workflowSecondaryIndexes, WorkflowSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.workflowVersions'),
    schema: [workflowVersionsSecondaryIndexes, WorkflowVersionSchema, WorkflowStepSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.workflowExecutions'),
    schema: [workflowExecutionsSecondaryIndexes, WorkflowExecutionSchema, WorkflowStepExecutionHistorySchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.integrations'),
    schema: [IntegrationAppsSchema, ClientSchema, EntityCountSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.integrationTokens'),
    schema: [ClientTokenSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.authOrganizations'),
    schema: [OrganizationSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.authUsers'),
    schema: [UserSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.apigwAuthorizer'),
    schema: [ApigwAuthorizerSchema],
  },
  {
    name: ConfigUtil.get('dynamodb.schema.resources'),
    schema: [ResourcesSchema],
  },
]);

@Module({
  imports: [workflowModel],
  exports: [workflowModel],
})
export class DynamoDBModule {}
