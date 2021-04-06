import { registerEnumType } from '@nestjs/graphql';

export enum OptionsOperator {
  Any,
  Between,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  NotLessThan,
  NotLessThanOrEqual,
  NotMoreThan,
  NotMoreThanOrEqual,
  NotLike,
  NotBetween,
  NotIn,
  NotAny,
  NotIsNull,
}

registerEnumType(OptionsOperator, {
  name: 'OptionsOperator',
});
