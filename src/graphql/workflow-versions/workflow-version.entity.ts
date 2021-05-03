import { Field, ObjectType } from '@nestjs/graphql';

export interface WorkflowVersionKey {
  WVID: string;
}

@ObjectType()
export class WorkflowVersion implements WorkflowVersionKey {
  @Field()
  WVID: string;

  @Field()
  CID: string;

  @Field()
  WID: string;

  @Field()
  WV: string;

  @Field()
  FAID: string;

  @Field()
  WLFN: string;
}
