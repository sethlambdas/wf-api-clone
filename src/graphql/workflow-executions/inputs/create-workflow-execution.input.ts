import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PARALLEL } from '../../workflow-executions/workflow-execution.entity';
import { ACTInput } from '../../workflow-steps/inputs/create-workflow-step.input';

@InputType()
class CATInput extends PartialType(ACTInput) {
  @Field()
  Status: string;
}

@InputType()
class PARALLELInput extends PartialType(PARALLEL, InputType) {}

@InputType()
export class CreateWorkflowExecutionInput {
  @Field({ nullable: true })
  WVID?: string;

  @Field({ nullable: true })
  WSID?: string;

  @Field((type) => [CATInput], { nullable: true })
  CAT?: CATInput[];

  @Field({ nullable: true })
  STE?: string;

  @Field((type) => [PARALLELInput], { nullable: true })
  PARALLEL?: PARALLELInput[];

  @Field()
  WLFN: string;

  @Field({ nullable: true })
  CRAT: string;
}
