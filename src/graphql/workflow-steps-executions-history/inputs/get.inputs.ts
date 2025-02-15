import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListAllManualApprovalInput extends PartialType(PaginationInput) {
  @Field()
  OrgId: string;

  @Field()
  Status: string;

  @Field({ nullable: true })
  LastKey?: string;
}

@InputType()
export class ListWorkflowStepExecutionHistoryOfAnExecutionInput extends PartialType(PaginationInput) {
  @Field({ nullable: true })
  workflowExecutionPK?: string;
}