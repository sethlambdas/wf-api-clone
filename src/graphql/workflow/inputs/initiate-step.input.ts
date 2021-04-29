import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class InitiateCurrentStepInput {
  @Field()
  WSID: string;

  @Field()
  ActivityType: string;

  @Field({ nullable: true })
  Approve?: boolean;
}
