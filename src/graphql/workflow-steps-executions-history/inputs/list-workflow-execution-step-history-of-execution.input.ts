import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListWorkflowStepExecutionHistoryOfAnExecutionInput extends PartialType(PaginationInput) {
  @Field()
  WorkflowId: string;

  @Field()
  workflowVersionSK: string;

  @Field({ nullable: true })
  WorkflowExecutionId?: string;
}
