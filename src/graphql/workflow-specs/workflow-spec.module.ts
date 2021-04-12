import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowSpecRepository } from './workflow-spec.repository';
import { WorkflowSpecResolver } from './workflow-spec.resolver';
import { WorkflowSpecSchema } from './workflow-spec.schema';
import { WorkflowSpecService } from './workflow-spec.service';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: ConfigUtil.get('dynamodb.schema.workflowSpecs'),
        schema: WorkflowSpecSchema,
      },
    ]),
  ],
  providers: [WorkflowSpecResolver, WorkflowSpecService, WorkflowSpecRepository],
})
export class WorkflowSpecModule {}
