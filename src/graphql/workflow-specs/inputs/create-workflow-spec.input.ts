import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowSpecInput {
  @Field()
  WVID: string;

  @Field()
  NAID: string;

  @Field()
  AID: string;

  @Field()
  ACT: string;
}
