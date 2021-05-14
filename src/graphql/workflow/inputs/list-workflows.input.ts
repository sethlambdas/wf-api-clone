import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListWorkflowsOfAnOrgInput extends PartialType(PaginationInput) {
  @Field()
  OrgId: string;

  @Field((type) => Int, { nullable: true })
  TotalWLF?: number;
}
