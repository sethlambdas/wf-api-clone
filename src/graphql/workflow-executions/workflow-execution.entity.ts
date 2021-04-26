import { Field, ObjectType, PartialType } from '@nestjs/graphql';
import { ACT } from '../workflow-steps/workflow-step.entity';

export interface WorkflowExecutionKey {
  WXID: string;
}

@ObjectType()
class CAT extends PartialType(ACT) {
  @Field()
  Status: string;
}

@ObjectType()
export class WorkflowExecution implements WorkflowExecutionKey {
  @Field()
  WXID: string;

  @Field()
  WSID: string;

  @Field((type) => [CAT])
  CAT: CAT[];

  @Field()
  STE: string;
}
