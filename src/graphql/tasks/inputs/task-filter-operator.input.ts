/* tslint:disable:max-classes-per-file */
import { Field, InputType, Int } from '@nestjs/graphql';
import { OptionsOperator } from '../../common/enums/options-operator.enum';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskFilterOperator } from '../interfaces/task-filter-operator.interface';

@InputType()
export class TaskFilterInput implements TaskFilterOperator {
  @Field(() => [Int], { nullable: true })
  id: number[];

  @Field(() => [String], { nullable: true })
  title: string[];

  @Field(() => [String], { nullable: true })
  description: string[];

  @Field(() => [TaskStatus], { nullable: true })
  status: TaskStatus[];

  @Field(() => [Int], { nullable: true })
  UserId: number[];
}

@InputType()
export class TaskOperatorInput implements TaskFilterOperator {
  @Field(() => OptionsOperator, { nullable: true })
  id: OptionsOperator;

  @Field(() => OptionsOperator, { nullable: true })
  title: OptionsOperator;

  @Field(() => OptionsOperator, { nullable: true })
  description: OptionsOperator;

  @Field(() => OptionsOperator, { nullable: true })
  status: OptionsOperator;

  @Field(() => OptionsOperator, { nullable: true })
  UserId: OptionsOperator;
}
