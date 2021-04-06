import { Field, InputType } from '@nestjs/graphql';
import { PaginationInput } from './pagination.input';
import { SortingInput } from './sorting.input';

@InputType()
export class ListSearchFilterInput {
  @Field((type) => SortingInput)
  sorting: SortingInput;

  @Field((type) => PaginationInput)
  pagination: PaginationInput;
}
