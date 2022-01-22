import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { GetWorkflowByNameInput } from './inputs/get-workflow-by-name.input';
import { InitiateAWorkflowStepInput } from './inputs/initiate-step.input';
import { ListWorkflowsOfAnOrgInput } from './inputs/list-workflows.input';
import { SaveWorkflowInput } from './inputs/save-workflow.input';
import { SearchWorkflowsOfAnOrgInput } from './inputs/search-workflows.input';
import { CreateWorkflowResponse, ListWorkflowsOfAnOrg, WorkflowModelRepository } from './workflow.entity';
import { WorkflowService } from './workflow.service';

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

  @Query((returns) => WorkflowModelRepository, { nullable: true })
  async GetWorkflowByName(@Args('getWorkflowByNameInput') getWorkflowByNameInput: GetWorkflowByNameInput) {
    return this.workflowService.getWorkflowByName(getWorkflowByNameInput);
  }

  @Query((returns) => ListWorkflowsOfAnOrg)
  async ListWorkflowsOfAnOrg(@Args('listWorkflowsOfAnOrgInput') listWorkflowsOfAnOrgInput: ListWorkflowsOfAnOrgInput) {
    return this.workflowService.listWorkflowsOfAnOrg(listWorkflowsOfAnOrgInput);
  }

  @Query((returns) => ListWorkflowsOfAnOrg)
  async SearchWorkflowsOfAnOrg(
    @Args('searchWorkflowsOfAnOrgInput') searchWorkflowsOfAnOrgInput: SearchWorkflowsOfAnOrgInput,
  ) {
    return this.workflowService.searchWorkflowsOfAnOrg(searchWorkflowsOfAnOrgInput);
  }
}
