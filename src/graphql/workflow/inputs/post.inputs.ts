import { Field, InputType, Int } from '@nestjs/graphql';
import { DesignWorkflowInput } from '../../common/entities/workflow-step.entity';
import { CompositePrimaryKeyInput } from '../../common/inputs/workflow-key.input';
import { StateWorkflowInput } from './put.inputs';

@InputType()
export class CreateWorkflowInputRepository {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field((type) => Int)
  WorkflowBatchNumber: number;

  @Field()
  FAID: string;

  @Field()
  UQ_OVL: string;
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field({ nullable: true })
  WorkflowPK?: string;

  @Field((type) => [DesignWorkflowInput], { nullable: true })
  Design?: DesignWorkflowInput[];

  @Field()
  StartAt: string;

  @Field((type) => [StateWorkflowInput])
  States: StateWorkflowInput[];
}

@InputType()
export class InitiateAWorkflowStepInput {
  @Field()
  WorkflowStepKeys: CompositePrimaryKeyInput;

  @Field()
  WorkflowExecutionKeys: CompositePrimaryKeyInput;

  @Field()
  WorkflowStepExecutionHistorySK: string;

  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;

  @Field()
  ActivityType: string;

  @Field({ nullable: true })
  Approve?: boolean;

  @Field({ nullable: true })
  isRerun?: boolean;
}
