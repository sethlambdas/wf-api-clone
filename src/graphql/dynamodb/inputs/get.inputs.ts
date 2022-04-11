import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { SortDir } from '../../common/enums/sort-dir.enum';
import { PaginationInput } from '../../common/inputs/pagination.input';

@InputType()
export class ListDynamoSearchInput extends PartialType(PaginationInput) {
  @Field((type) => [String], { nullable: true, defaultValue: [] })
  sortBy?: string[];

  @Field((type) => [SortDir], { nullable: true, defaultValue: [] })
  sortDir?: SortDir[];
}
