import { Field, Int, ObjectType, PartialType } from '@nestjs/graphql';
import { ACT } from '../workflow-steps/workflow-step.entity';

export interface WorkflowExecutionKey {
  WXID: string;
}

@ObjectType()
export class CAT extends PartialType(ACT) {
  @Field()
  WSID: string;

  @Field()
  Status: string;
}

@ObjectType()
export class PARALLEL {
  @Field((type) => Boolean)
  isParallelActive: boolean;

  @Field((type) => Int)
  totalParallelCount: number;

  @Field((type) => Int)
  finishedParallelCount: number;
}

@ObjectType()
export class WorkflowExecution implements WorkflowExecutionKey {
  @Field()
  WXID: string;

  @Field()
  WVID: string;

  @Field((type) => [CAT])
  CAT: CAT[];

  @Field()
  STE: string;

  @Field((type) => [PARALLEL], { nullable: true })
  PARALLEL?: PARALLEL[];
}
