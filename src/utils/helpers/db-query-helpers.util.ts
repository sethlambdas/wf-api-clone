import { classToPlain } from 'class-transformer';
import * as _ from 'lodash';
import {
  Any,
  Between,
  Equal,
  FindOperator,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  SelectQueryBuilder,
} from 'typeorm';
import { OptionsOperator } from '../../graphql/common/enums/options-operator.enum';
import { SortDir } from '../../graphql/common/enums/sort-dir.enum';
import { PaginationInput } from '../../graphql/common/inputs/pagination.input';
import { SortingInput } from '../../graphql/common/inputs/sorting.input';
import { PaginateInterface } from '../../graphql/common/interfaces/paginate.interface';

export function queryFilter(filter: any) {
  if (!filter) return null;
  const dbFilter: { [key: string]: unknown } = {};
  for (const option in filter) {
    if (filter[option]) {
      dbFilter[option] = filter[option];
    }
  }
  return dbFilter;
}

export function getOffset(page: number, pageSize: number): number {
  const offset = (page - 1) * pageSize;
  return offset;
}

export function getTotalPages(pageSize: number, totalRecords: number): number {
  let totalPages = Math.floor(totalRecords / pageSize);
  // in case we have a remainder we add an extra page to cover the extra records
  if (totalRecords % pageSize > 0) {
    ++totalPages;
  }
  return totalPages;
}

export function paginateResult<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalRecords: number,
): PaginateInterface<T> {
  return {
    data: data.map((row): any => classToPlain(row)),
    page,
    pageSize,
    totalRecords,
    totalPages: getTotalPages(pageSize, totalRecords),
  };
}

export function queryBuilderSorting<T>(
  queryBuilder: SelectQueryBuilder<T>,
  sortBy: string[],
  sortDir: SortDir[],
): SelectQueryBuilder<T> {
  for (const [sortIndex, sort] of sortBy.entries()) {
    const order = (sortIndex + 1 <= sortDir.length && sortDir[sortIndex]) || SortDir.ASC;
    if (sortIndex === 0) {
      queryBuilder.orderBy(sort, order);
    } else {
      queryBuilder.addOrderBy(sort, order);
    }
  }
  return queryBuilder;
}

export function queryFindOperator<T>(op: OptionsOperator, value: any | FindOperator<T>): FindOperator<T> {
  switch (op) {
    case OptionsOperator.Any:
      return Any(value);
    case OptionsOperator.Between:
      return Between(value[0], value[1]);
    case OptionsOperator.In:
      return In(value);
    case OptionsOperator.IsNull:
      return IsNull();
    case OptionsOperator.LessThan:
      return LessThan(value);
    case OptionsOperator.LessThanOrEqual:
      return LessThanOrEqual(value);
    case OptionsOperator.Like:
      return Like(value);
    case OptionsOperator.MoreThan:
      return MoreThan(value);
    case OptionsOperator.MoreThanOrEqual:
      return MoreThanOrEqual(value);
    case OptionsOperator.Not:
      return Not(value);
    case OptionsOperator.NotLessThan:
      return Not(queryFindOperator(value, OptionsOperator.LessThan));
    case OptionsOperator.NotLessThanOrEqual:
      return Not(queryFindOperator(value, OptionsOperator.LessThanOrEqual));
    case OptionsOperator.NotMoreThan:
      return Not(queryFindOperator(value, OptionsOperator.MoreThan));
    case OptionsOperator.NotMoreThanOrEqual:
      return Not(queryFindOperator(value, OptionsOperator.MoreThanOrEqual));
    case OptionsOperator.NotLike:
      return Not(queryFindOperator(value, OptionsOperator.Like));
    case OptionsOperator.NotBetween:
      return Not(queryFindOperator(value, OptionsOperator.Between));
    case OptionsOperator.NotIn:
      return Not(queryFindOperator(value, OptionsOperator.In));
    case OptionsOperator.NotAny:
      return Not(queryFindOperator(value, OptionsOperator.Any));
    case OptionsOperator.NotIsNull:
      return Not(queryFindOperator(value, OptionsOperator.IsNull));
    default:
      return Equal(value);
  }
}

export function querySearch(filter: any[], operators: any[], sorting: SortingInput, pagination: PaginationInput) {
  const where = _.map(filter, (filterObj, filterIndex) => {
    const newObj = {};
    _.forOwn(filterObj, (filterValue, filterKey) => {
      const opObj = operators && filterIndex < operators.length && operators[filterIndex];
      const opValue = _.get(opObj, filterKey);
      newObj[filterKey] = queryFindOperator(opValue, filterValue);
    });
    return newObj;
  });
  const offset = pagination && getOffset(pagination.page, pagination.pageSize);
  const order = sorting && _.zipObject(sorting.sortBy, sorting.sortDir);
  return {
    where,
    order,
    skip: offset,
    take: pagination.pageSize,
  };
}
