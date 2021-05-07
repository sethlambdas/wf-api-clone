import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { CreateWorkflowExecutionInput } from './inputs/create-workflow-execution.input';
import { SaveWorkflowExecutionInput } from './inputs/save-workflow-execution.input';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowExecutionService } from './workflow-execution.service';

@Resolver((of) => WorkflowExecution)
export class WorkflowExecutionResolver {
  constructor(private workflowExecutionService: WorkflowExecutionService) {}

  @Mutation((returns) => WorkflowExecution)
  async CreateWorkflowExecution(
    @Args('createWorkflowExecutionInput') createWorkflowExecutionInput: CreateWorkflowExecutionInput,
  ) {
    return this.workflowExecutionService.createWorkflowExecution(createWorkflowExecutionInput);
  }

  @Mutation((returns) => WorkflowExecution)
  async SaveWorkflowExecution(
    @Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput,
    @Args('saveWorkflowExecutionInput') saveWorkflowExecutionInput: SaveWorkflowExecutionInput,
  ) {
    return this.workflowExecutionService.saveWorkflowExecution(workflowKeysInput, saveWorkflowExecutionInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowExecution(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowExecutionService.deleteWorkflowExecution(workflowKeysInput);
  }

  @Query((returns) => WorkflowExecution)
  async GetWorkflowExecution(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowExecutionService.getWorkflowExecution(workflowKeysInput);
  }

  @Query((returns) => [WorkflowExecution])
  async ListWorkflowExecutions() {
    return this.workflowExecutionService.listWorkflowExecutions();
  }
}
