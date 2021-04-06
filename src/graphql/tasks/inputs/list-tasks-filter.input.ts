import { Field, InputType } from '@nestjs/graphql';
import { ListSearchFilterInput } from '../../common/inputs/list-search-filter.input';
import { TaskFilterInput, TaskOperatorInput } from './task-filter-operator.input';

@InputType()
export class ListTasksFilterInput extends ListSearchFilterInput {
  @Field((type) => [TaskFilterInput])
  filter: TaskFilterInput[];

  @Field((type) => [TaskOperatorInput])
  operators: TaskOperatorInput[];
}
