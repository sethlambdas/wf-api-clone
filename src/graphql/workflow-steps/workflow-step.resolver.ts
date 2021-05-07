import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WorkflowKeysInput } from '../common/inputs/workflow-key.input';
import { CreateWorkflowStepInput } from './inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from './inputs/save-workflow-step.input';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowStepService } from './workflow-step.service';

@Resolver((of) => WorkflowStep)
export class WorkflowStepResolver {
  constructor(private workflowStepService: WorkflowStepService) {}

  @Mutation((returns) => WorkflowStep)
  async CreateWorkflowStep(@Args('createWorkflowStepInput') createWorkflowStepInput: CreateWorkflowStepInput) {
    return this.workflowStepService.createWorkflowStep(createWorkflowStepInput);
  }

  @Mutation((returns) => WorkflowStep)
  async SaveWorkflowStep(
    @Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput,
    @Args('saveWorkflowStepInput') saveWorkflowStepInput: SaveWorkflowStepInput,
  ) {
    return this.workflowStepService.saveWorkflowStep(workflowKeysInput, saveWorkflowStepInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowStep(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowStepService.deleteWorkflowStep(workflowKeysInput);
  }

  @Query((returns) => WorkflowStep)
  async GetWorkflowStep(@Args('workflowKeysInput') workflowKeysInput: WorkflowKeysInput) {
    return this.workflowStepService.getWorkflowStep(workflowKeysInput);
  }

  @Query((returns) => [WorkflowStep])
  async ListWorkflowSteps() {
    return this.workflowStepService.listWorkflowSteps();
  }
}
