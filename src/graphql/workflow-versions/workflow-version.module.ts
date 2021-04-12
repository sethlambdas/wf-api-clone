import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowVersionRepository } from './workflow-version.repository';
import { WorkflowVersionResolver } from './workflow-version.resolver';
import { WorkflowVersionSchema } from './workflow-version.schema';
import { WorkflowVersionService } from './workflow-version.service';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: ConfigUtil.get('dynamodb.schema.workflowVersions'),
        schema: WorkflowVersionSchema,
      },
    ]),
  ],
  providers: [WorkflowVersionResolver, WorkflowVersionService, WorkflowVersionRepository],
})
export class WorkflowVersionModule {}
