import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { CreateTaskInput } from './create-task.input';

@InputType()
export class SaveTaskInput extends PartialType(CreateTaskInput) {
  @Field((type) => TaskStatus, { nullable: true })
  @IsOptional()
  status?: TaskStatus;
}
