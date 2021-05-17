import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ACT, DesignWorkflow } from '../common/entities/workflow-step.entity';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

@ObjectType()
export class WorkflowVersion implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  CID: string;

  @Field()
  WV: string;

  @Field()
  FAID: string;

  @Field((type) => Int)
  TotalEXC: number;
}

@ObjectType()
export class WorkflowVersionDetails {
  @Field()
  WorkflowVersionSK: string;

  @Field((type) => [ACT], { nullable: true })
  Activities?: ACT[];

  @Field((type) => [DesignWorkflow], { nullable: true })
  Design?: DesignWorkflow[];
}

@ObjectType()
export class ListWorkflowVersions {
  @Field((type) => [WorkflowVersion])
  WorkflowVersions: WorkflowVersion[];

  @Field((type) => Int)
  TotalRecords: number;

  @Field({ nullable: true })
  LastKey?: string;
}
