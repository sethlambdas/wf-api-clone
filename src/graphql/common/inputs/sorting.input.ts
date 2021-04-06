import { Field, InputType } from '@nestjs/graphql';
import { SortDir } from '../enums/sort-dir.enum';

@InputType()
export class SortingInput {
  @Field((type) => [String], { nullable: true, defaultValue: ['id'] })
  sortBy?: string[];

  @Field((type) => [SortDir], { nullable: true, defaultValue: [SortDir.ASC] })
  sortDir?: SortDir[];
}
