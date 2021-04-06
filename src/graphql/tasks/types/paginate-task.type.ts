import { ObjectType } from '@nestjs/graphql';
import { PaginateResult } from '../../common/types/paginate-result.type';
import { Task } from '../task.entity';

@ObjectType()
export class PaginateTask extends PaginateResult(Task) {}
