import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CreateWorkflowStepExecutionHistoryInput } from './inputs/create.input';
import { ListAllManualApprovalInput } from './inputs/get-all-approval.input';
import { SaveWorkflowStepExecutionHistoryInput } from './inputs/save.input';
import { ListAllManualApprovalResponse, WorkflowStepExecutionHistory } from './workflow-steps-wxh.entity';
import { WorkflowStepExecutionHistoryService } from './workflow-steps-wxh.service';

@Resolver((of) => WorkflowStepExecutionHistory)
export class WorkflowStepExecutionHistoryResolver {
  constructor(private workflowStepExecutionHistoryService: WorkflowStepExecutionHistoryService) {}

  @Mutation((returns) => WorkflowStepExecutionHistory)
  async CreateWorkflowStepExecutionHistory(
    @Args('createWorkflowStepExecutionHistoryInput')
    createWorkflowStepExecutionHistoryInput: CreateWorkflowStepExecutionHistoryInput,
  ) {
    return this.workflowStepExecutionHistoryService.createWorkflowStepExecutionHistory(
      createWorkflowStepExecutionHistoryInput,
    );
  }

  @Mutation((returns) => WorkflowStepExecutionHistory)
  async SaveWorkflowStepExecutionHistory(
    @Args('workflowStepExecutionHistoryKeyInput') workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput,
    @Args('saveWorkflowStepExecutionHistoryInput')
    saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput,
  ) {
    return this.workflowStepExecutionHistoryService.saveWorkflowStepExecutionHistory(
      workflowStepExecutionHistoryKeyInput,
      saveWorkflowStepExecutionHistoryInput,
    );
  }

  @Query((returns) => WorkflowStepExecutionHistory, { nullable: true })
  async GetWorkflowStepExecutionHistoryByKey(
    @Args('workflowStepExecutionHistoryKeyInput') workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput,
  ) {
    return this.workflowStepExecutionHistoryService.getWorkflowStepExecutionHistoryByKey(
      workflowStepExecutionHistoryKeyInput,
    );
  }

  @Query((returns) => ListAllManualApprovalResponse)
  async ListAllManualApprovalBasedOnStatus(
    @Args('listAllManualApprovalInput') listAllManualApprovalInput: ListAllManualApprovalInput,
  ) {
    return this.workflowStepExecutionHistoryService.listAllManualApproval(listAllManualApprovalInput);
  }

  @Mutation((returns) => Boolean, { nullable: true })
  async DeleteWorkflowStepExecutionHistory(
    @Args('workflowStepExecutionHistoryKeyInput') workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput,
  ) {
    return this.workflowStepExecutionHistoryService.deleteWorkflowStepExecutionHistory(
      workflowStepExecutionHistoryKeyInput,
    );
  }
}
