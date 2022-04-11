import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CompositePrimaryKeyInput } from '../../common/inputs/workflow-key.input';
import { PARALLEL } from '../workflow-execution.entity';

@InputType()
class PARALLELInput extends PartialType(PARALLEL, InputType) {}

@InputType()
export class CreateWorkflowExecutionInput {
  @Field((type) => CompositePrimaryKeyInput)
  WorkflowVersionKeys: CompositePrimaryKeyInput;

  @Field((type) => [String])
  WSXH_IDS: string[];

  @Field({ nullable: true })
  STE?: string;

  @Field((type) => [PARALLELInput], { nullable: true })
  PARALLEL?: PARALLELInput[];

  @Field()
  STATUS: string;
}
