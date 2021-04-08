import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowVersionInput {
  @Field()
  CID: string;

  @Field()
  WID: string;
}
