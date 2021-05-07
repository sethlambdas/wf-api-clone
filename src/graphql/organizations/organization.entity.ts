import { Field, ObjectType } from '@nestjs/graphql';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';

@ObjectType()
export class Organization implements WorkflowKeys {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  ORGNAME: string;
}
