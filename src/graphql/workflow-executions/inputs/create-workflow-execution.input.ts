import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { PARALLEL } from '../../workflow-executions/workflow-execution.entity';
import { ACTInput } from '../../workflow-steps/inputs/create-workflow-step.input';

@InputType()
class CATInput extends OmitType(ACTInput, ['DESIGN'] as const) {
  @Field()
  Status: string;
}

@InputType()
class PARALLELInput extends PartialType(PARALLEL, InputType) {}

@InputType()
export class CreateWorkflowExecutionInput {
  @Field()
  PK: string;

  @Field()
  WVID: string;

  @Field({ nullable: true })
  CRAT: string;

  @Field((type) => [CATInput], { nullable: true })
  CAT?: CATInput[];

  @Field({ nullable: true })
  STE?: string;

  @Field((type) => [PARALLELInput], { nullable: true })
  PARALLEL?: PARALLELInput[];
}
