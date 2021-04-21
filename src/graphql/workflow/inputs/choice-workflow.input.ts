import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ChoiceWorkflowInput {
  @Field({ nullable: true })
  Variable?: string;

  @Field({ nullable: true })
  Operator?: string;

  @Field({ nullable: true })
  RightHand?: string;

  @Field({ nullable: true })
  Next?: string;
}
