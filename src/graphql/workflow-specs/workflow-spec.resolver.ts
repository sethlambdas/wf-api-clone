import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateWorkflowSpecInput } from './inputs/create-workflow-spec.input';
import { SaveWorkflowSpecInput } from './inputs/save-workflow-spec.input';
import { WorkflowSpec } from './workflow-spec.entity';
import { WorkflowSpecService } from './workflow-spec.service';

@Resolver((of) => WorkflowSpec)
export class WorkflowSpecResolver {
  constructor(private workflowSpecService: WorkflowSpecService) {}

  @Mutation((returns) => WorkflowSpec)
  async CreateWorkflowSpec(@Args('createWorkflowSpecInput') createWorkflowSpecInput: CreateWorkflowSpecInput) {
    return this.workflowSpecService.createWorkflowSpec(createWorkflowSpecInput);
  }

  @Mutation((returns) => WorkflowSpec)
  async SaveWorkflowSpec(
    @Args('id', { type: () => String }) id: string,
    @Args('saveWorkflowSpecInput') saveWorkflowSpecInput: SaveWorkflowSpecInput,
  ) {
    return this.workflowSpecService.saveWorkflowSpec(id, saveWorkflowSpecInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowSpec(@Args('id', { type: () => String }) id: string) {
    return this.workflowSpecService.deleteWorkflowSpec(id);
  }

  @Query((returns) => WorkflowSpec)
  async GetWorkflowSpec(@Args('id', { type: () => String }) id: string) {
    return this.workflowSpecService.getWorkflowSpec(id);
  }

  @Query((returns) => [WorkflowSpec])
  async ListWorkflowSpecs() {
    return this.workflowSpecService.listWorkflowSpecs();
  }
}
