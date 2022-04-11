import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetWorkflowStepByAidInput {
  @Field()
  AID: string;

  @Field()
  WorkflowStepPK: string;
}
