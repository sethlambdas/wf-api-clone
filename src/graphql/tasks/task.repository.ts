import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { paginateResult, querySearch } from '../../utils/db-query-helpers.util';
import { User } from '../users/user.entity';
import { TaskStatus } from './enums/task-status.enum';
import { CreateTaskInput } from './inputs/create-task.input';
import { ListTasksFilterInput } from './inputs/list-tasks-filter.input';
import { SaveTaskInput } from './inputs/save-task.input';
import { Task } from './task.entity';
import { PaginateTask } from './types/paginate-task.type';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private readonly logger = new Logger(TaskRepository.name);

  async listTasks(user: User, listTasksFilterInput: ListTasksFilterInput): Promise<PaginateTask> {
    const { filter, operators, sorting, pagination } = listTasksFilterInput;

    const { where, order, skip, take } = querySearch(filter, operators, sorting, pagination);

    const [data, totalRecords] = await this.findAndCount({
      where,
      order,
      skip,
      take,
    });

    return paginateResult(data, pagination.page, pagination.pageSize, totalRecords);
  }

  async getTaskById(user: User, id: number): Promise<Task> {
    const task = await this.findOne({
      where: { UserId: user.id, id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async createTask(user: User, createTaskInput: CreateTaskInput): Promise<Task> {
    const { title, description } = createTaskInput;

    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    task.UserId = user.id;

    try {
      await task.save();
    } catch (error) {
      this.logger.error(`Failed to create a task for user "${user.email}". Data: ${createTaskInput}`, error.stack);
      throw new InternalServerErrorException();
    }

    return task;
  }

  async saveTask(user: User, id: number, saveTaskInput: SaveTaskInput): Promise<Task> {
    const { title, description, status } = saveTaskInput;

    const task = await this.findOne({ where: { id, UserId: user.id } });

    if (title) {
      task.title = title;
    }

    if (description) {
      task.description = description;
    }

    if (status) {
      task.status = status;
    }

    try {
      await task.save();
    } catch (error) {
      this.logger.error(`Failed to save a task for user "${user.email}". Data: ${saveTaskInput}`, error.stack);
      throw new InternalServerErrorException();
    }

    return task;
  }

  async deleteTask(user: User, id: number): Promise<boolean> {
    const result = await this.delete({ UserId: user.id, id });

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return true;
  }
}
