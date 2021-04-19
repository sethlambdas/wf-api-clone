import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
    @Args('id', { type: () => String }) id: string,
    @Args('saveWorkflowStepInput') saveWorkflowStepInput: SaveWorkflowStepInput,
  ) {
    return this.workflowStepService.saveWorkflowStep(id, saveWorkflowStepInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowStep(@Args('id', { type: () => String }) id: string) {
    return this.workflowStepService.deleteWorkflowStep(id);
  }

  @Query((returns) => WorkflowStep)
  async GetWorkflowStep(@Args('id', { type: () => String }) id: string) {
    return this.workflowStepService.getWorkflowStep(id);
  }

  @Query((returns) => [WorkflowStep])
  async ListWorkflowSteps() {
    return this.workflowStepService.listWorkflowSteps();
  }
}
