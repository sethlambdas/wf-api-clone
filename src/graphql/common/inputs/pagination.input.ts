import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
  @Field((type) => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field((type) => Int, { nullable: true, defaultValue: 10 })
  pageSize?: number;
}
