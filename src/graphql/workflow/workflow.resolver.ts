import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateWorkflowInput } from './inputs/create-workflow.input';
import { WorkflowService } from './workflow.service';

@Resolver()
export class WorkflowResolver {
  constructor(private workflowService: WorkflowService) {}

  @Mutation((returns) => String)
  async CreateWorkflow(@Args('createWorkflowInput') createWorkflowInput: CreateWorkflowInput) {
    return this.workflowService.createWorkflow(createWorkflowInput);
  }
}
