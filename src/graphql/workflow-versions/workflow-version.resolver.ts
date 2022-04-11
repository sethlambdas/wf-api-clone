import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

import { GetWorkflowVersionDetailsInput, ListAllWorkflowVersionsOfWorkflowInput } from './inputs/get.inputs';
import { CreateWorkflowVersionInput } from './inputs/post.inputs';
import { SaveWorkflowVersionInput } from './inputs/put.inputs';
import { ListWorkflowVersions, WorkflowVersion, WorkflowVersionDetails } from './workflow-version.entity';
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
    @Args('workflowVersionKeysInput') workflowVersionKeysInput: CompositePrimaryKeyInput,
    @Args('saveWorkflowVersionInput') saveWorkflowVersionInput: SaveWorkflowVersionInput,
  ) {
    return this.workflowVersionService.saveWorkflowVersion(workflowVersionKeysInput, saveWorkflowVersionInput);
  }

  @Query((returns) => WorkflowVersionDetails)
  async GetWorkflowVersionDetails(
    @Args('getWorkflowVersionDetailsInput') getWorkflowVersionDetailsInput: GetWorkflowVersionDetailsInput,
  ) {
    return this.workflowVersionService.getWorkflowVersionDetails(getWorkflowVersionDetailsInput);
  }

  @Query((returns) => WorkflowVersion, { nullable: true })
  async GetWorkflowVersionByKey(@Args('workflowVersionKeysInput') workflowVersionKeysInput: CompositePrimaryKeyInput) {
    return this.workflowVersionService.getWorkflowVersionByKey(workflowVersionKeysInput);
  }

  @Query((returns) => ListWorkflowVersions)
  async ListAllWorkflowVersionsOfWorkflow(
    @Args('listAllWorkflowVersionsOfWorkflowInput')
    listAllWorkflowVersionsOfWorkflowInput: ListAllWorkflowVersionsOfWorkflowInput,
  ) {
    return await this.workflowVersionService.listAllWorkflowVersionsOfWorkflow(listAllWorkflowVersionsOfWorkflowInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowVersion(@Args('workflowVersionKeysInput') workflowVersionKeysInput: CompositePrimaryKeyInput) {
    return this.workflowVersionService.deleteWorkflowVersion(workflowVersionKeysInput);
  }
}
