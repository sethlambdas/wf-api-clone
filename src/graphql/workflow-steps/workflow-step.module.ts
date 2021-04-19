import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowStepRepository } from './workflow-step.repository';
import { WorkflowStepResolver } from './workflow-step.resolver';
import { WorkflowStepSchema } from './workflow-step.schema';
import { WorkflowStepService } from './workflow-step.service';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: ConfigUtil.get('dynamodb.schema.workflowSteps'),
        schema: WorkflowStepSchema,
      },
    ]),
  ],
  providers: [WorkflowStepResolver, WorkflowStepService, WorkflowStepRepository],
  exports: [WorkflowStepService],
})
export class WorkflowStepModule {}
