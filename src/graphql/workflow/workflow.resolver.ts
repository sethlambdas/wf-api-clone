import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreateWorkflowInput, InitiateAWorkflowStepInput } from './inputs/post.inputs';
import { GetWorkflowByNameInput, GetWorkflowsOfAnOrgInput } from './inputs/get.inputs';
import { SaveWorkflowInput } from './inputs/put.inputs';
import { CreateWorkflowResponse, GetWorkflowsOfAnOrg, WorkflowModelRepository } from './workflow.entity';
import { WorkflowService } from './workflow.service';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

@Resolver()
export class WorkflowResolver {
  constructor(private workflowService: WorkflowService) {}

  @Mutation((returns) => CreateWorkflowResponse)
  async CreateWorkflow(@Args('createWorkflowInput') createWorkflowInput: CreateWorkflowInput) {
    return this.workflowService.createWorkflow(createWorkflowInput);
  }

  @Mutation((returns) => WorkflowModelRepository)
  async SaveWorkflow(@Args('saveWorkflowInput') saveWorkflowInput: SaveWorkflowInput) {
    return this.workflowService.saveWorkflow(saveWorkflowInput);
  }

  @Mutation((returns) => String)
  async InitiateAWorkflowStep(
    @Args('initiateAWorkflowStepInput') initiateAWorkflowStepInput: InitiateAWorkflowStepInput,
  ) {
    return this.workflowService.initiatAWorkflowStep(initiateAWorkflowStepInput);
  }

  @Mutation((returns) => Boolean)
  async DisableWorkflowTrigger(@Args('workflowKeysInput') workflowKeysInput: CompositePrimaryKeyInput) {
    return this.workflowService.disableWorkflowTrigger(workflowKeysInput);
  }

  @Mutation((returns) => Boolean)
  async EnableWorkflowTrigger(@Args('workflowKeysInput') workflowKeysInput: CompositePrimaryKeyInput) {
    return this.workflowService.enableWorkflowTrigger(workflowKeysInput);
  }

  @Query((returns) => WorkflowModelRepository, { nullable: true })
  async GetWorkflowByKey(@Args('workflowKeysInput') workflowKeysInput: CompositePrimaryKeyInput) {
    return this.workflowService.getWorkflowByKey(workflowKeysInput);
  }
  
  @Query((returns) => WorkflowModelRepository, { nullable: true })
  async GetWorkflowByName(@Args('getWorkflowByNameInput') getWorkflowByNameInput: GetWorkflowByNameInput) {
    return this.workflowService.getWorkflowByName(getWorkflowByNameInput);
  }

  @Query((returns) => GetWorkflowsOfAnOrg)
  async GetWorkflowsOfAnOrg(@Args('getWorkflowsOfAnOrgInput') getWorkflowsOfAnOrgInput: GetWorkflowsOfAnOrgInput) {
    return this.workflowService.getWorkflowOfAnOrg(getWorkflowsOfAnOrgInput);
  }
}
