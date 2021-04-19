import { Field, InputType } from '@nestjs/graphql';
import { VariableWorkflowInput } from './variable-workflow.input';

@InputType()
export class StateWorkflowInput {
  @Field()
  ActivityId: string;

  @Field()
  ActivityType: string;

  @Field((type) => [String], { nullable: true })
  NextActivities?: string[];

  @Field((type) => VariableWorkflowInput, { nullable: true })
  Variables?: VariableWorkflowInput;

  @Field((type) => Boolean, { nullable: true })
  End?: boolean;
}
