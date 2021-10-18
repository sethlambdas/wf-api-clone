/* tslint:disable:max-classes-per-file */
import { Field, Float, InputType, Int, ObjectType, OmitType, PartialType, PickType } from '@nestjs/graphql';

// Object Types

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
  // Email or ManualApproval or Email Ingestion
  @Field({ nullable: true })
  Email?: string;

  @Field({ nullable: true })
  Subject?: string;

  @Field({ nullable: true })
  Body?: string;

  // Delay & Recurring
  @Field({ nullable: true })
  Days?: string;

  // Delay & Recurring
  @Field({ nullable: true })
  Hours?: string;

  // Delay & Recurring
  @Field({ nullable: true })
  Minutes?: string;

  @Field({ nullable: true })
  Seconds?: string;

  // ExactTime
  @Field({ nullable: true })
  Date?: string;

  // Conditional
  @Field((type) => [ChoiceWorkflow], { nullable: true })
  Choice?: ChoiceWorkflow[];

  @Field({ nullable: true })
  DefaultNext?: string;

  // AssignData
  @Field({ nullable: true })
  CustomVariables?: string;

  // MergeData
  @Field({ nullable: true })
  StoreVariable?: string;

  @Field({ nullable: true })
  JoinValues?: string;

  // WebService & HTTP
  @Field({ nullable: true })
  Endpoint?: string;

  // WebService & Start
  @Field({ nullable: true })
  Name?: string;

  // WebService
  @Field({ nullable: true })
  Method?: string;

  @Field({ nullable: true })
  ClientPK?: string;

  @Field({ nullable: true })
  ClientSK?: string;

  @Field({ nullable: true })
  Headers?: string;

  @Field({ nullable: true })
  QueryStrings?: string;

  @Field({ nullable: true })
  Files?: string;

  @Field({ nullable: true })
  FileFilter?: string;

  @Field({ nullable: true })
  Evaluations?: string;

  @Field({ nullable: true })
  Retries?: number;

  @Field({ nullable: true })
  Interval?: number;

  @Field({ nullable: true })
  ErrorAction?: string;

  // ManualApproval
  @Field((type) => Boolean, { nullable: true })
  Completed?: boolean;

  @Field({ nullable: true })
  ApproveStep?: string;

  @Field({ nullable: true })
  RejectStep?: string;

  @Field({ nullable: true })
  Purpose?: string;

  // FormEditor
  @Field({ nullable: true })
  FormDataSchema?: string;

  @Field({ nullable: true })
  FormUiSchema?: string;

  @Field({ nullable: true })
  FormData?: string;

  // Trigger Type
  @Field(() => Boolean, { nullable: true })
  IsTrigger?: boolean;

  // HTTP
  @Field({ nullable: true })
  AID?: string;

  @Field({ nullable: true })
  OrgId?: string;

  // External Services
  @Field({ nullable: true })
  ExternalServiceAction?: string;

  // Email Ingestion Service
  @Field({ nullable: true })
  Password?: string;

  @Field({ nullable: true })
  Port?: number;

  @Field(() => Boolean, { nullable: true })
  TLS?: boolean;

  @Field({ nullable: true })
  source_folder?: string;

  @Field({ nullable: true })
  destination_folder?: string;

  // OCR
  @Field({ nullable: true })
  TesseractConfig?: string;
}

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

  @Field({ nullable: true })
  labelIconName?: string;

  @Field()
  state: string;

  @Field((type) => MD, { nullable: true })
  variables?: MD;
}

@ObjectType()
export class Position {
  @Field((type) => Float)
  x: number;

  @Field((type) => Float)
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
export class ACT {
  @Field()
  T: string;

  @Field()
  NM: string;

  @Field((type) => MD, { nullable: true })
  MD?: MD;

  @Field((type) => Boolean, { defaultValue: false })
  END?: boolean;

  @Field((type) => [DesignWorkflow])
  DESIGN: DesignWorkflow[];
}

// Input Types

@InputType()
export class ChoiceWorkflowInput extends PartialType(ChoiceWorkflow, InputType) {}

@InputType()
export class MDInput extends OmitType(MD, ['Choice'] as const, InputType) {
  // Conditional
  @Field((type) => [ChoiceWorkflowInput], { nullable: true })
  Choice?: ChoiceWorkflowInput[];
}

@InputType()
export class LabelInput extends PickType(Label, ['iconName', 'name'] as const, InputType) {}

@InputType()
export class PositionInput extends PickType(Position, ['x', 'y'] as const, InputType) {}

@InputType()
export class DataInput extends OmitType(Data, ['label', 'variables'] as const, InputType) {
  @Field((type) => MDInput, { nullable: true })
  variables?: MDInput;

  @Field((type) => LabelInput, { nullable: true })
  label?: LabelInput;
}

@InputType()
export class DesignWorkflowInput extends OmitType(DesignWorkflow, ['id', 'data', 'position'] as const, InputType) {
  @Field()
  id: string;

  @Field((type) => DataInput, { nullable: true })
  data?: DataInput;

  @Field((type) => PositionInput, { nullable: true })
  position?: PositionInput;
}

@InputType()
export class ACTInput extends OmitType(ACT, ['DESIGN', 'MD'] as const, InputType) {
  @Field((type) => MDInput, { nullable: true })
  MD?: MDInput;

  @Field((type) => [DesignWorkflowInput])
  DESIGN: DesignWorkflowInput[];
}
