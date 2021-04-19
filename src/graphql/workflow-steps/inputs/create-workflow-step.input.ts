import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowStepInput {
  @Field()
  WVID: string;

  @Field()
  NAID: string;

  @Field()
  AID: string;

  @Field()
  ACT: string;
}
