import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';

import { CreateWorkflowStepInput } from './inputs/post.inputs';
import { GetWorkflowStepByAidInput } from './inputs/get.inputs';
import { SaveWorkflowStepInput } from './inputs/put.inputs';
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
    @Args('workflowStepKeysInput') workflowStepKeysInput: CompositePrimaryKeyInput,
    @Args('saveWorkflowStepInput') saveWorkflowStepInput: SaveWorkflowStepInput,
  ) {
    return this.workflowStepService.saveWorkflowStep(workflowStepKeysInput, saveWorkflowStepInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowStep(@Args('workflowStepKeysInput') workflowStepKeysInput: CompositePrimaryKeyInput) {
    return this.workflowStepService.deleteWorkflowStep(workflowStepKeysInput);
  }

  @Query((returns) => WorkflowStep, { nullable: true })
  async GetWorkflowStepByKey(@Args('workflowStepKeysInput') workflowStepKeysInput: CompositePrimaryKeyInput) {
    return this.workflowStepService.getWorkflowStepByKey(workflowStepKeysInput);
  }

  @Query((returns) => WorkflowStep, { nullable: true })
  async GetWorkflowStepByAid(@Args('getWorkflowStepByAidInput') getWorkflowStepByAidInput: GetWorkflowStepByAidInput) {
    return this.workflowStepService.getWorkflowStepByAid(getWorkflowStepByAidInput);
  }

  @Query((returns) => [WorkflowStep])
  async GetWorkflowStepsWithinAVersion(@Args('workflowVersionSK') workflowVersionSK: string) {
    return this.workflowStepService.getWorkflowStepWithinAVersion(workflowVersionSK);
  }
}
