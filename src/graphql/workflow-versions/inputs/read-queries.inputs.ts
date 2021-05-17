import { Field, InputType, PartialType } from '@nestjs/graphql';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListAllWorkflowVersionsOfWorkflowInput extends PartialType(PaginationInput) {
  @Field()
  WorkflowPK: string;

  @Field({ nullable: true })
  LastKey?: string;
}
