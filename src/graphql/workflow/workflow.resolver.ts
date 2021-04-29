import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { GetWorkflowDetailsInput } from './inputs/get-workflow.input';
import { InitiateCurrentStepInput } from './inputs/initiate-step.input';
import { WorkflowDetails } from './workflow.entity';
import { WorkflowService } from './workflow.service';

@Resolver()
export class WorkflowResolver {
  constructor(private workflowService: WorkflowService) {}

  @Mutation((returns) => String)
  async CreateWorkflow(@Args('createWorkflowInput') createWorkflowInput: CreateWorkflowInput) {
    return this.workflowService.createWorkflow(createWorkflowInput);
  }

  @Query((returns) => WorkflowDetails)
  async GetWorkflowDetails(@Args('getWorkflowDetailsInput') getWorkflowDetailsInput: GetWorkflowDetailsInput) {
    return this.workflowService.getWorkflowDetails(getWorkflowDetailsInput);
  }
  @Query((returns) => String)
  async InitiateCurrentStep(@Args('initiateCurrentStepInput') initiateCurrentStepInput: InitiateCurrentStepInput) {
    return this.workflowService.initiateCurrentStep(initiateCurrentStepInput);
  }
}
