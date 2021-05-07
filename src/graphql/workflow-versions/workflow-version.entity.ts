import { Field, ObjectType } from '@nestjs/graphql';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';

@ObjectType()
export class WorkflowVersion implements WorkflowKeys {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  WVID: string;

  @Field()
  CID: string;

  @Field()
  WV: string;

  @Field()
  FAID: string;
}
