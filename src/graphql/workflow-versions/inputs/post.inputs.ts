import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateWorkflowVersionInput {
  @Field()
  WorkflowPK: string;

  @Field()
  WorkflowName: string;

  @Field()
  CID: string;

  @Field((type) => Int)
  WV: number;

  @Field()
  FAID: string;
}
