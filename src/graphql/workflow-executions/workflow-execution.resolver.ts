import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

import { CreateWorkflowExecutionInput } from './inputs/post.inputs';
import { ListWorkflowExecutionsOfAnOrganizationInput, ListWorkflowExecutionsOfAVersionInput } from './inputs/get.inputs';
import { SaveWorkflowExecutionInput } from './inputs/put.inputs';
import { ListWorkflowExecution, WorkflowExecution } from './workflow-execution.entity';
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
    @Args('workflowExecutionKeysInput') workflowExecutionKeysInput: CompositePrimaryKeyInput,
    @Args('saveWorkflowExecutionInput') saveWorkflowExecutionInput: SaveWorkflowExecutionInput,
  ) {
    return this.workflowExecutionService.saveWorkflowExecution(workflowExecutionKeysInput, saveWorkflowExecutionInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowExecution(
    @Args('workflowExecutionKeysInput') workflowExecutionKeysInput: CompositePrimaryKeyInput,
  ) {
    return this.workflowExecutionService.deleteWorkflowExecution(workflowExecutionKeysInput);
  }

  @Query((returns) => WorkflowExecution, { nullable: true })
  async GetWorkflowExecutionByKey(
    @Args('workflowExecutionKeysInput') workflowExecutionKeysInput: CompositePrimaryKeyInput,
  ) {
    return this.workflowExecutionService.getWorkflowExecutionByKey(workflowExecutionKeysInput);
  }

  @Query((returns) => ListWorkflowExecution)
  async ListWorkflowExecutionsOfAVersion(
    @Args('listWorkflowExecutionsOfAVersionInput')
    listWorkflowExecutionsOfAVersionInput: ListWorkflowExecutionsOfAVersionInput,
  ) {
    return this.workflowExecutionService.listWorkflowExecutionsOfAVersion(listWorkflowExecutionsOfAVersionInput);
  }

  @Query((returns) => ListWorkflowExecution)
  async ListWorkflowExecutionsOfAnOrganization(
    @Args('listWorkflowExecutionsOfAnOrganizationInput')
    listWorkflowExecutionsOfAnOrganizationInput: ListWorkflowExecutionsOfAnOrganizationInput,
  ) {
    return this.workflowExecutionService.listWorkflowExecutionsOfAnOrganization(listWorkflowExecutionsOfAnOrganizationInput);
  }
}
