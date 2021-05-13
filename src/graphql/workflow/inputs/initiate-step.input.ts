import { Field, InputType } from '@nestjs/graphql';
import { CompositePrimaryKeyInput } from '../../common/inputs/workflow-key.input';

@InputType()
export class InitiateAWorkflowStepInput {
  @Field()
  WorkflowStepKeys: CompositePrimaryKeyInput;

  @Field()
  WorkflowExecutionKeys: CompositePrimaryKeyInput;

  @Field()
  WorkflowStepExecutionHistorySK: string;

  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field()
  ActivityType: string;

  @Field({ nullable: true })
  Approve?: boolean;
}
