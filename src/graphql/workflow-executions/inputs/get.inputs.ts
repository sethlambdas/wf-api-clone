import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

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
