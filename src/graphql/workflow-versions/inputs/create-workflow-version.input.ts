import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowVersionInput {
  @Field()
  WLFID: string;

  @Field()
  CID: string;

  @Field()
  WV: string;

  @Field()
  FAID: string;
}
