import { Module } from '@nestjs/common';
import { WorkflowExecutionModule } from '../workflow-executions/workflow-execution.module';
import { WorkflowStepModule } from '../workflow-steps/workflow-step.module';
import { WorkflowVersionModule } from '../workflow-versions/workflow-version.module';
import { WorkflowResolver } from './workflow.resolver';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [WorkflowStepModule, WorkflowVersionModule, WorkflowExecutionModule],
  providers: [WorkflowResolver, WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
