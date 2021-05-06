/* tslint:disable:max-classes-per-file */
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Label {
  @Field()
  iconName: string;

  @Field()
  name: string;
}

@ObjectType()
export class Data {
  @Field((type) => Label, { nullable: true })
  label?: Label;

  @Field()
  nodeType: string;

  @Field()
  labelIconName: string;

  @Field()
  state: string;
}

@ObjectType()
export class Position {
  @Field((type) => Int)
  x: number;

  @Field((type) => Int)
  y: number;
}

@ObjectType()
export class DesignWorkflow {
  @Field()
  id: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  target?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  style?: string;

  @Field((type) => Data, { nullable: true })
  data?: Data;

  @Field((type) => Position, { nullable: true })
  position?: Position;
}

@ObjectType()
export class ChoiceWorkflow {
  @Field({ nullable: true })
  Variable?: string;

  @Field({ nullable: true })
  Operator?: string;

  @Field({ nullable: true })
  RightHand?: string;

  @Field({ nullable: true })
  Next?: string;
}

@ObjectType()
export class MD {
  // Email
  @Field({ nullable: true })
  Email?: string;

  @Field({ nullable: true })
  Subject?: string;

  @Field({ nullable: true })
  Body?: string;

  // Delay
  @Field({ nullable: true })
  Hours?: string;

  @Field({ nullable: true })
  Minutes?: string;

  @Field({ nullable: true })
  Seconds?: string;

  // ExactTime
  @Field({ nullable: true })
  Date?: string;

  // Conditional
  @Field((type) => [ChoiceWorkflow], { nullable: true })
  Choices?: ChoiceWorkflow[];

  @Field({ nullable: true })
  DefaultNext?: string;

  // ManualApproval
  @Field((type) => Boolean, { nullable: true })
  Completed?: boolean;

  // AssignData
  @Field({ nullable: true })
  FieldValues?: string;

  // MergeData
  @Field({ nullable: true })
  StoreVariable?: string;

  @Field({ nullable: true })
  JoinValues?: string;

  // WebService
  @Field({ nullable: true })
  Endpoint?: string;

  // WebService
  @Field({ nullable: true })
  Name?: string;
}

@ObjectType()
export class ACT {
  @Field()
  T: string;

  @Field()
  NM: string;

  @Field((type) => MD)
  MD: MD;

  @Field((type) => Boolean, { nullable: true })
  END?: boolean;

  @Field((type) => [DesignWorkflow])
  DESIGN: DesignWorkflow[];
}

export interface WorkflowStepKey {
  WSID: string;
}

@ObjectType()
export class WorkflowStep implements WorkflowStepKey {
  @Field()
  WSID: string;

  @Field()
  WVID: string;

  @Field((type) => [String])
  NAID: string[];

  @Field()
  AID: string;

  @Field((type) => ACT)
  ACT: ACT;
}
