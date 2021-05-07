import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { LastKey } from '../workflow-executions/workflow-execution.entity';
import { ACT } from '../workflow-steps/workflow-step.entity';
import { DesignWorkflow } from '../workflow-steps/workflow-step.entity';

@ObjectType()
export class CreateWorkflowResponse {
  @Field({ nullable: true })
  PK?: string;

  @Field({ nullable: true })
  SK?: string;

  @Field({ nullable: true })
  IsWorkflowNameExist?: boolean;
}

@ObjectType()
export class WorkflowDetails {
  @Field()
  PK: string;

  @Field()
  WorkflowVersionSK: string;

  @Field((type) => [ACT], { nullable: true })
  Activities?: ACT[];

  @Field((type) => [DesignWorkflow], { nullable: true })
  Design?: DesignWorkflow[];
}

@ObjectType()
class Workflow {
  @Field()
  WXID: string;

  @Field()
  WLFN: string;

  @Field()
  CRAT: string;
}

@ObjectType()
export class ListWorkflows {
  @Field((type) => [Workflow])
  Workflows: Workflow[];

  @Field((type) => LastKey, { nullable: true })
  LastKey?: LastKey;

  @Field((type) => Int)
  TotalRecords: number;
}

@ObjectType()
export class WorkflowModelRepository implements WorkflowKeys {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  WLFN: string;

  @Field()
  DATA: string;
}
