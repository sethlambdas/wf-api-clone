import { OptionsOperator } from '../../common/enums/options-operator.enum';
import { TaskStatus } from '../enums/task-status.enum';

export interface TaskFilterOperator {
  id: number[] | OptionsOperator;
  title: string[] | OptionsOperator;
  description: string[] | OptionsOperator;
  status: TaskStatus[] | OptionsOperator;
  UserId: number[] | OptionsOperator;
}
