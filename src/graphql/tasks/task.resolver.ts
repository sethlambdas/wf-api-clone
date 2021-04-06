import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { memoizeAsync } from 'utils-decorators';
import { ConfigUtil } from '../../utils/config.util';
import { GetUser } from '../users/auth/get-user.decorator';
import { GQLAuthGuard } from '../users/auth/gql.auth.guard';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { CreateTaskInput } from './inputs/create-task.input';
import { ListTasksFilterInput } from './inputs/list-tasks-filter.input';
import { SaveTaskInput } from './inputs/save-task.input';
import { Task } from './task.entity';
import { TaskService } from './task.service';
import { PaginateTask } from './types/paginate-task.type';

@UsePipes(ValidationPipe)
@UseGuards(GQLAuthGuard)
@Resolver((of) => Task)
export class TaskResolver {
  constructor(private taskService: TaskService, private userService: UserService) {}

  @Query((returns) => PaginateTask)
  @memoizeAsync(ConfigUtil.get('cache.expiresIn'))
  async ListTasks(@GetUser() user: User, @Args('listTasksFilterInput') listTasksFilterInput: ListTasksFilterInput) {
    return this.taskService.listTasks(user, listTasksFilterInput);
  }

  @Query((returns) => Task)
  @memoizeAsync(ConfigUtil.get('cache.expiresIn'))
  async GetTask(@GetUser() user: User, @Args('id', { type: () => Int }) id: number) {
    return this.taskService.getTaskById(user, id);
  }

  @Mutation((returns) => Task)
  async CreateTask(@GetUser() user: User, @Args('createTaskInput') createTaskInput: CreateTaskInput) {
    return this.taskService.createTask(user, createTaskInput);
  }

  @Mutation((returns) => Task)
  async SaveTask(
    @GetUser() user: User,
    @Args('id', { type: () => Int }) id: number,
    @Args('saveTaskInput') saveTaskInput: SaveTaskInput,
  ) {
    return this.taskService.saveTask(user, id, saveTaskInput);
  }

  @Mutation((returns) => Boolean)
  async DeleteTask(@GetUser() user: User, @Args('id', { type: () => Int }) id: number) {
    return this.taskService.deleteTask(user, id);
  }

  /// FIELD RESOLVERS ///
  @ResolveField()
  async User(@Parent() task: Task) {
    const { UserId: id } = task;
    return this.userService.getUserById(id);
  }
}
