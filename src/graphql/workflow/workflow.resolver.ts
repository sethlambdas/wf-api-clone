import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { GetWorkflowByNameInput } from './inputs/get-workflow-by-name.input';
import { InitiateAWorkflowStepInput } from './inputs/initiate-step.input';
import { ListWorkflowsOfAnOrgInput } from './inputs/list-workflows.input';
import { CreateWorkflowResponse, ListWorkflowsOfAnOrg, WorkflowModelRepository } from './workflow.entity';
import { WorkflowService } from './workflow.service';

@Resolver()
export class WorkflowResolver {
  constructor(private workflowService: WorkflowService) {}

  @Mutation((returns) => CreateWorkflowResponse)
  async CreateWorkflow(@Args('createWorkflowInput') createWorkflowInput: CreateWorkflowInput) {
    return this.workflowService.createWorkflow(createWorkflowInput);
  }

  @Mutation((returns) => String)
  async InitiateAWorkflowStep(
    @Args('initiateAWorkflowStepInput') initiateAWorkflowStepInput: InitiateAWorkflowStepInput,
  ) {
    return this.workflowService.initiatAWorkflowStep(initiateAWorkflowStepInput);
  }

  @Query((returns) => WorkflowModelRepository)
  async GetWorkflowByName(@Args('getWorkflowByNameInput') getWorkflowByNameInput: GetWorkflowByNameInput) {
    return this.workflowService.getWorkflowByName(getWorkflowByNameInput);
  }

  @Query((returns) => ListWorkflowsOfAnOrg)
  async ListWorkflowsOfAnOrg(@Args('listWorkflowsOfAnOrgInput') listWorkflowsOfAnOrgInput: ListWorkflowsOfAnOrgInput) {
    return this.workflowService.listWorkflowsOfAnOrg(listWorkflowsOfAnOrgInput);
  }
}
