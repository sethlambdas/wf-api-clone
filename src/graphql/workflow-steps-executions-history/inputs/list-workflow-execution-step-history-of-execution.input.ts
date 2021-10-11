import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListWorkflowStepExecutionHistoryOfAnExecutionInput extends PartialType(PaginationInput) {
  @Field({ nullable: true })
  workflowExecutionPK?: string;
}
