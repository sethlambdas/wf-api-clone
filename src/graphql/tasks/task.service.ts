import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { CreateTaskInput } from './inputs/create-task.input';
import { ListTasksFilterInput } from './inputs/list-tasks-filter.input';
import { SaveTaskInput } from './inputs/save-task.input';
import { Task } from './task.entity';
import { TaskRepository } from './task.repository';
import { PaginateTask } from './types/paginate-task.type';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskRepository)
    private taskRepository: TaskRepository,
  ) {}

  async listTasks(user: User, listTasksFilterInput: ListTasksFilterInput): Promise<PaginateTask> {
    return this.taskRepository.listTasks(user, listTasksFilterInput);
  }

  async getTaskById(user: User, id: number): Promise<Task> {
    return this.taskRepository.getTaskById(user, id);
  }

  async createTask(user: User, createTaskInput: CreateTaskInput): Promise<Task> {
    return this.taskRepository.createTask(user, createTaskInput);
  }

  async saveTask(user: User, id: number, saveTaskInput: SaveTaskInput): Promise<Task> {
    return this.taskRepository.saveTask(user, id, saveTaskInput);
  }

  async deleteTask(user: User, id: number): Promise<boolean> {
    return this.taskRepository.deleteTask(user, id);
  }
}
