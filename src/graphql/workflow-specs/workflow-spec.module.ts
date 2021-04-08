import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowSpecRepository } from './workflow-spec.repository';
import { WorkflowSpecSchema } from './workflow-spec.schema';
import { WorkflowSpecService } from './workflow-spec.service';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: ConfigUtil.get('aws.dynamodb.schema.workflowSpecs'),
        schema: WorkflowSpecSchema,
      },
    ]),
  ],
  providers: [WorkflowSpecService, WorkflowSpecRepository],
})
export class WorkflowSpecModule {}
