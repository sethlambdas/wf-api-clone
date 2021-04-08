import { Field, ObjectType } from '@nestjs/graphql';

export interface WorkflowSpecKey {
  WSID: string;
}

@ObjectType()
export class WorkflowSpec implements WorkflowSpecKey {
  @Field()
  WSID: string;

  @Field()
  WVID: string;

  @Field()
  NAID: string;

  @Field()
  AID: string;

  @Field()
  ACT: string;
}
