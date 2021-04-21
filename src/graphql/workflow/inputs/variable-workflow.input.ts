import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class VariableWorkflowInput {
  // Email
  @Field({ nullable: true })
  Email?: string;

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
  @Field({ nullable: true })
  Variable?: string;

  @Field({ nullable: true })
  Operator?: string;

  @Field({ nullable: true })
  RightHand?: string;

  @Field({ nullable: true })
  ResultAction?: string;

  // ManualInput
  @Field((type) => Boolean, { nullable: true })
  Completed?: boolean;

  // AssignData
  @Field({ nullable: true })
  Data?: string;

  // WebService
  @Field({ nullable: true })
  Endpoint?: string;

  // WebService
  @Field({ nullable: true })
  Name?: string;
}
