import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class GetWorkflowByNameInput {
  @Field()
  OrgId: string;

  @Field()
  WorkflowName: string;
}

@InputType()
export class GetWorkflowByUniqueKeyInput {
  @Field()
  UniqueKey: string;
}

@InputType()
export class GetWorkflowsOfAnOrgInput extends PartialType(PaginationInput) {
  @Field()
  orgId: string;

  @Field({ nullable: true })
  search?: string;
}