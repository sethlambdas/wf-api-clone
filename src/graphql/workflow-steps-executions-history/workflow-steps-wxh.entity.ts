/* tslint:disable:max-classes-per-file */
import { Field, Int, ObjectType, OmitType } from '@nestjs/graphql';
import { ACT, MD } from '../common/entities/workflow-step.entity';
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
export class WorkflowStepExecutionHistory
  extends OmitType(ACT, ['DESIGN', 'END', 'NM'] as const)
  implements CompositePrimaryKey {
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

  @Field()
  WorkflowVersion: string;

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
