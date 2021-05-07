import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
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
    @Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput,
    @Args('saveWorkflowVersionInput') saveWorkflowVersionInput: SaveWorkflowVersionInput,
  ) {
    return this.workflowVersionService.saveWorkflowVersion(workflowKeysInput, saveWorkflowVersionInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowVersion(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowVersionService.deleteWorkflowVersion(workflowKeysInput);
  }

  @Query((returns) => WorkflowVersion)
  async GetWorkflowVersion(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowVersionService.getWorkflowVersion(workflowKeysInput);
  }

  @Query((returns) => [WorkflowVersion])
  async ListWorkflowVersions() {
    return this.workflowVersionService.listWorkflowVersions();
  }
}
