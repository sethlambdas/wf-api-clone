import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';
import { LastKey } from '../../workflow-executions/workflow-execution.entity';

@InputType()
export class WorkflowsLastKeyInput extends PartialType(LastKey, InputType) {}

@InputType()
export class ListWorkflowInput extends PartialType(PaginationInput) {
  @Field({ nullable: true })
  CRAT?: string;

  @Field((type) => WorkflowsLastKeyInput, { nullable: true })
  LastKey?: WorkflowsLastKeyInput;
}
