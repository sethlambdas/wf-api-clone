import { Field, ObjectType } from '@nestjs/graphql';

export interface WorkflowExecutionKey {
  WXID: string;
}

@ObjectType()
export class WorkflowExecution implements WorkflowExecutionKey {
  @Field()
  WXID: string;

  @Field()
  WSID: string;

  @Field()
  CAT: string;

  @Field()
  STE: string;
}
