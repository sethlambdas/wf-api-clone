/* tslint:disable:max-classes-per-file */
import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
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
export class WebService {
  @Field({ nullable: true })
  Request?: string;

  @Field({ nullable: true })
  Result?: string;

  @Field({ nullable: true })
  Error?: string;
}

@ObjectType()
export class WorkflowStepExecutionHistory
  extends OmitType(ACT, ['DESIGN', 'END'] as const)
  implements CompositePrimaryKey
{
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  WLFN: string;

  @Field()
  WSID: string;

  @Field()
  Status: string;

  @Field((type) => Boolean, { defaultValue: false })
  END?: boolean;

  @Field((type) => WebService, { nullable: true })
  WEB_SERVICE?: WebService;
}

@ObjectType()
class CompositePK implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;
}

@ObjectType()
export class GetAllManualApproval {
  @Field((type) => CompositePK)
  WorkflowExecutionKeys: CompositePK;

  @Field((type) => CompositePK)
  WorkflowStepKeys: CompositePK;

  @Field()
  WorkflowStepExecutionHistorySK: string;

  @Field()
  WorkflowName: string;

  @Field((type) => Int)
  WorkflowVersion: number;

  @Field()
  Email: string;
}

@ObjectType()
export class ListAllManualApprovalResponse {
  @Field((type) => [GetAllManualApproval])
  ManualApprovals: GetAllManualApproval[];

  @Field({ nullable: true })
  LastKey?: string;

  @Field((type) => Int)
  TotalRecords: number;
}

@ObjectType()
export class ListWorkflowStepExecutionHistory {
  @Field((type) => [WorkflowStepExecutionHistory], { nullable: true })
  WorkflowStepExecutionHistory?: WorkflowStepExecutionHistory[];

  @Field((type) => Int, { nullable: true })
  TotalRecords?: number;

  @Field({ nullable: true })
  Error?: string;
}
