import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowVersionInput {
  @Field()
  WLFID: string;

  @Field()
  CID: string;

  @Field((type) => Int)
  WV: number;

  @Field()
  FAID: string;
}
