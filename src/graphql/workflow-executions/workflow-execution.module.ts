import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowExecutionRepository } from './workflow-execution.repository';
import { WorkflowExecutionResolver } from './workflow-execution.resolver';
import { WorkflowExecutionSchema } from './workflow-execution.schema';
import { WorkflowExecutionService } from './workflow-execution.service';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: ConfigUtil.get('dynamodb.schema.workflowExecutions'),
        schema: WorkflowExecutionSchema,
      },
    ]),
  ],
  providers: [WorkflowExecutionResolver, WorkflowExecutionService, WorkflowExecutionRepository],
  exports: [WorkflowExecutionService],
})
export class WorkflowExecutionModule {}
