import { Field, InputType, PartialType } from '@nestjs/graphql';
import { VariableWorkflowInput } from './common.inputs';
import { WorkflowModelRepository } from '../workflow.entity';

@InputType()
export class SaveWorkflowInput extends PartialType(WorkflowModelRepository, InputType) {}

@InputType()
export class StateWorkflowInput {
  @Field()
  ActivityId: string;

  @Field()
  ActivityType: string;

  @Field((type) => [String], { nullable: true })
  NextActivities?: string[];

  @Field((type) => VariableWorkflowInput, { nullable: true })
  Variables?: VariableWorkflowInput;

  @Field((type) => Boolean, { nullable: true })
  End?: boolean;
}
