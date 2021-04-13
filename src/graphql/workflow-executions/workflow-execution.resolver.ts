import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
    @Args('id', { type: () => String }) id: string,
    @Args('saveWorkflowExecutionInput') saveWorkflowExecutionInput: SaveWorkflowExecutionInput,
  ) {
    return this.workflowExecutionService.saveWorkflowExecution(id, saveWorkflowExecutionInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowExecution(@Args('id', { type: () => String }) id: string) {
    return this.workflowExecutionService.deleteWorkflowExecution(id);
  }

  @Query((returns) => WorkflowExecution)
  async GetWorkflowExecution(@Args('id', { type: () => String }) id: string) {
    return this.workflowExecutionService.getWorkflowExecution(id);
  }

  @Query((returns) => [WorkflowExecution])
  async ListWorkflowExecutions() {
    return this.workflowExecutionService.listWorkflowExecutions();
  }
}
