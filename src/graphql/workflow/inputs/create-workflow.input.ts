import { Field, InputType } from '@nestjs/graphql';
import { StateWorkflowInput } from './state-workflow.input';

@InputType()
export class CreateWorkflowInput {
  @Field({ nullable: true })
  WorkflowId?: string;

  @Field()
  StartAt: string;

  @Field((type) => [StateWorkflowInput])
  States: StateWorkflowInput[];
}
