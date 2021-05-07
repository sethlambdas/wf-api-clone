import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { ACT } from '../workflow-steps/workflow-step.entity';

@ObjectType()
export class CAT extends OmitType(ACT, ['DESIGN', 'END'] as const) {
  @Field()
  WSID: string;

  @Field()
  Status: string;

  @Field((type) => Boolean, { defaultValue: false })
  END?: boolean;
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
export class WorkflowExecution implements WorkflowKeys {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  WXID: string;

  @Field((type) => [CAT])
  CAT: CAT[];

  @Field()
  STE: string;

  @Field((type) => [PARALLEL], { nullable: true })
  PARALLEL?: PARALLEL[];

  @Field()
  CRAT: string;
}

@ObjectType()
export class LastKey {
  @Field()
  WXID: string;

  @Field()
  CRAT: string;
}

@ObjectType()
export class QueryListWFExecutions {
  @Field((type) => [WorkflowExecution])
  Executions: WorkflowExecution[];

  @Field((type) => LastKey, { nullable: true })
  lastKey?: LastKey;

  @Field((type) => Int)
  totalRecords: number;
}
