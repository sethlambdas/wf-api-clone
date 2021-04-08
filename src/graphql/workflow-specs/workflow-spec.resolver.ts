// import { Args, Mutation, Resolver } from '@nestjs/graphql';
// import { CreateWorkflowSpecInput } from './inputs/create-workflow-spec.input';
// import { WorkflowSpec } from './workflow-spec.entity';
// import { WorkflowSpecService } from './workflow-spec.service';

// @Resolver((of) => WorkflowSpec)
// export class WorkflowSpecResolver {
//   constructor(private workflowSpecService: WorkflowSpecService) {}

//   // @Mutation((returns) => WorkflowSpec)
//   // async CreateWorkflowSpec(@Args('createWorkflowSpecInput') createWorkflowSpecInput: CreateWorkflowSpecInput) {
//   //   const workflowSpec = {
//   //     ...createWorkflowSpecInput,
//   //   } as WorkflowSpec;
//   //   return this.workflowSpecService.createWorkflowSpec(workflowSpec);
//   // }
// }
