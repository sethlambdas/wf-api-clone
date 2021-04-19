import { Field, ObjectType } from '@nestjs/graphql';

export interface WorkflowStepKey {
  WSID: string;
}

@ObjectType()
export class WorkflowStep implements WorkflowStepKey {
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
