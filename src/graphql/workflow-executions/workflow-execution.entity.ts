import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { WebService } from '../workflow-steps-executions-history/workflow-steps-wxh.entity';
import { ACT } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

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
export class WorkflowExecution implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field((type) => WebService, { nullable: true })
  WEB_SERVICE?: WebService;

  @Field((type) => [String])
  WSXH_IDS: string[];

  @Field({ nullable: true })
  STE?: string;

  @Field((type) => [PARALLEL], { nullable: true })
  PARALLEL?: PARALLEL[];

  @Field()
  STATUS: string;

  @Field()
  T?: string;

  @Field()
  created_at?: string;
}

@ObjectType()
export class ListWorkflowExecution {
  @Field((type) => [WorkflowExecution], { nullable: true })
  WorkflowExecution?: WorkflowExecution[];

  @Field((type) => Int, { nullable: true })
  TotalRecords?: number;

  @Field({ nullable: true })
  Error?: string;
}

@ObjectType()
export class ListAllWorkflowExecution {
  @Field((type) => ListWorkflowExecution, { nullable: true })
  TotalWorkflowExecution?: ListWorkflowExecution;

  @Field((type) => ListWorkflowExecution, { nullable: true })
  CurrentWorkflowExecution?: ListWorkflowExecution;
}
