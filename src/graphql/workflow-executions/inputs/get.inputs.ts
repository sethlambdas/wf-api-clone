import { Field, InputType, Int, PartialType,ObjectType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';


@InputType()
class WFEDateFilterInput {
  @Field()
  startDate?: string;

  @Field()
  endDate?: string;
}
@InputType()
export class ListWorkflowExecutionsOfAVersionInput extends PartialType(PaginationInput) {
  @Field()
  WorkflowId: string;

  @Field()
  workflowVersionSK: string;

  @Field({ defaultValue: 'asc' })
  order: string;

  @Field((type) => Int, { nullable: true })
  TotalEXC?: number;
}
@InputType()
export class ListWorkflowExecutionsOfAnOrganizationInput extends PartialType(PaginationInput) {
  @Field()
  OrgId: string;
  @Field((type) => WFEDateFilterInput, { nullable: true })
  filter?: WFEDateFilterInput;
}
