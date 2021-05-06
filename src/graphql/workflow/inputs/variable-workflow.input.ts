import { Field, InputType } from '@nestjs/graphql';
import { ChoiceWorkflowInput } from './choice-workflow.input';

@InputType()
export class VariableWorkflowInput {
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
  @Field((type) => [ChoiceWorkflowInput], { nullable: true })
  Choices?: ChoiceWorkflowInput[];

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

  // ManualApproval
  @Field({ nullable: true })
  ApproveStep?: string;

  // ManualApproval
  @Field({ nullable: true })
  RejectStep?: string;
}
