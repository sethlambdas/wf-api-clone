import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

registerEnumType(Status, {
  name: 'Status',
});

@ObjectType()
class PrimaryKey implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;
}

@ObjectType()
export class CreateWorkflowResponse {
  @Field((type) => PrimaryKey, { nullable: true })
  WorkflowKeys?: PrimaryKey;

  @Field((type) => PrimaryKey, { nullable: true })
  WorkflowVersionKeys?: PrimaryKey;

  @Field({ nullable: true })
  WorkflowVersion?: number;

  @Field({ nullable: true })
  IsWorkflowNameExist?: boolean;

  @Field({ nullable: true })
  Error?: string;
}

@ObjectType()
export class WorkflowModelRepository implements CompositePrimaryKey {
  @Field()
  PK: string;

  @Field()
  SK: string;

  @Field()
  WLFN: string;

  @Field()
  DATA: string;

  @Field()
  FAID: string;

  @Field((type) => Status)
  STATUS: Status;

  @Field()
  UQ_OVL: string;

  @Field()
  TriggerStatus: string;

  @Field({ nullable: true })
  TimeTriggerRuleName?: string;

  @Field({ nullable: true })
  Error?: string
}

@ObjectType()
export class ListWorkflowsOfAnOrg {
  @Field((type) => [WorkflowModelRepository], { nullable: true })
  Workflows?: WorkflowModelRepository[];

  @Field((type) => Int, { nullable: true })
  TotalRecords?: number;

  @Field({ nullable: true })
  Error?: string;
}

@ObjectType()
export class GetWorkflowsOfAnOrg {
  @Field((type) => [WorkflowModelRepository], { nullable: true })
  Workflows?: WorkflowModelRepository[];

  @Field((type) => Int, { nullable: true })
  TotalPages?: number;

  @Field({ nullable: true })
  Error?: string;
}
