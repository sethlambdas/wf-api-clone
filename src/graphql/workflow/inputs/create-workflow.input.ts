import { Field, InputType } from '@nestjs/graphql';
import { DesignWorkflowInput } from './design-workflow.input';
import { StateWorkflowInput } from './state-workflow.input';

@InputType()
export class CreateWorkflowInput {
  @Field({ nullable: true })
  WorkflowId?: string;

  @Field((type) => [DesignWorkflowInput], { nullable: true })
  Design?: DesignWorkflowInput[];

  @Field()
  StartAt: string;

  @Field((type) => [StateWorkflowInput])
  States: StateWorkflowInput[];

  @Field()
  WLFN: string;
}
