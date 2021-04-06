import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaginateInterface } from '../interfaces/paginate.interface';

export function PaginateResult<T>(classType: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements PaginateInterface<T> {
    @Field((type) => [classType])
    data: T[];

    @Field((type) => Int)
    totalRecords: number;

    @Field((type) => Int)
    totalPages: number;

    @Field((type) => Int)
    page: number;

    @Field((type) => Int)
    pageSize: number;
  }
  return PaginatedType;
}
