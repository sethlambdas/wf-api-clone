import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateWorkflowVersionInput } from './inputs/create-workflow-version.input';
import { SaveWorkflowVersionInput } from './inputs/save-workflow-version.input';
import { WorkflowVersion } from './workflow-version.entity';
import { WorkflowVersionService } from './workflow-version.service';

@Resolver((of) => WorkflowVersion)
export class WorkflowVersionResolver {
  constructor(private workflowVersionService: WorkflowVersionService) {}

  @Mutation((returns) => WorkflowVersion)
  async CreateWorkflowVersion(
    @Args('createWorkflowVersionInput') createWorkflowVersionInput: CreateWorkflowVersionInput,
  ) {
    return this.workflowVersionService.createWorkflowVersion(createWorkflowVersionInput);
  }

  @Mutation((returns) => WorkflowVersion)
  async SaveWorkflowVersion(
    @Args('id', { type: () => String }) id: string,
    @Args('saveWorkflowVersionInput') saveWorkflowVersionInput: SaveWorkflowVersionInput,
  ) {
    return this.workflowVersionService.saveWorkflowVersion(id, saveWorkflowVersionInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowVersion(@Args('id', { type: () => String }) id: string) {
    return this.workflowVersionService.deleteWorkflowVersion(id);
  }

  @Query((returns) => WorkflowVersion)
  async GetWorkflowVersion(@Args('id', { type: () => String }) id: string) {
    return this.workflowVersionService.getWorkflowVersion(id);
  }

  @Query((returns) => [WorkflowVersion])
  async ListWorkflowVersions() {
    return this.workflowVersionService.listWorkflowVersions();
  }
}
