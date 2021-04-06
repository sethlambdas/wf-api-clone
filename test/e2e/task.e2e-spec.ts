import { HttpStatus } from '@nestjs/common';
import * as faker from 'faker';
import * as request from 'supertest';
import { SortDir } from '../../src/graphql/common/enums/sort-dir.enum';
import { TaskStatus } from '../../src/graphql/tasks/enums/task-status.enum';
import { ListTasksFilterInput } from '../../src/graphql/tasks/inputs/list-tasks-filter.input';
import { Task } from '../../src/graphql/tasks/task.entity';
import { authBearerToken, dataTesting, getHttpServerTesting, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  listTasksQuery: `
    query ListTasks($listTasksFilterInput: ListTasksFilterInput!) {
      ListTasks(listTasksFilterInput: $listTasksFilterInput) {
        totalPages
        page
        pageSize
        totalRecords
        data {
          id
          title
          description
        }
      }
    }
  `,
  getTaskQuery: `
    query GetTask($id: Int!) {
      GetTask(id: $id) {
        id
        title
        description
      }
    }
  `,
  createTaskMutation: `
    mutation CreateTask($createTaskInput: CreateTaskInput!) {
      CreateTask(createTaskInput: $createTaskInput) {
        id
        title
        description
      }
    }
  `,
  saveTaskMutation: `
    mutation SaveTask($id: Int!, $saveTaskInput: SaveTaskInput!) {
      SaveTask(id: $id, saveTaskInput: $saveTaskInput) {
        id
        title
        description
        status
      }
    }
  `,
  deleteTaskMutation: `
    mutation DeleteTask($id: Int!) {
      DeleteTask(id: $id)
    }
  `,
};

const createTaskInput = {
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
};

const createTaskInvalidInput = {
  title: 'abc',
  description: 'abcd',
};

const saveTaskInput = {
  title: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  status: TaskStatus.IN_PROGRESS,
};

const listTasksFilterInput: ListTasksFilterInput = {
  filter: [
    {
      title: [createTaskInput.title],
    } as any,
  ],
  operators: [
    {
      title: 'In',
    } as any,
  ],
  sorting: {
    sortBy: ['status'],
    sortDir: [SortDir.DESC],
  },
  pagination: {
    page: 1,
    pageSize: 2,
  },
};

let userAccessToken;

describe('TaskResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
    const { accessToken } = await dataTesting();
    userAccessToken = accessToken;
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createTask', () => {
    it('should create the task of the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.createTaskMutation,
          variables: {
            createTaskInput,
          },
        })
        .expect(({ body: { data } }) => {
          const createTask = data.CreateTask;
          expect(createTask.id).toBe(1);
          expect(createTask.title).toBe(createTaskInput.title);
          expect(createTask.description).toBe(createTaskInput.description);
        })
        .expect(200);
    });

    it('should return errors on invalid create task data', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.createTaskMutation,
          variables: {
            createTaskInput: createTaskInvalidInput,
          },
        })
        .expect(({ body: { errors } }) => {
          expect(errors[0].message).toBe('Bad Request Exception');
          expect(errors[0].extensions.exception.status).toBe(HttpStatus.BAD_REQUEST);
        })
        .expect(200);
    });
  });

  describe('listTasks', () => {
    it('should list the tasks of the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.listTasksQuery,
          variables: {
            listTasksFilterInput,
          },
        })
        .expect(({ body: { data } }) => {
          const listTasks = data.ListTasks;
          expect(listTasks.totalPages).toBe(1);
          expect(listTasks.page).toBe(1);
          expect(listTasks.pageSize).toBe(2);
          expect(listTasks.totalRecords).toBe(1);
          expect(listTasks.data).toEqual(
            expect.arrayContaining([
              {
                id: 1,
                title: createTaskInput.title,
                description: createTaskInput.description,
              },
            ]),
          );
        })
        .expect(200);
    });

    it('should list the tasks of the user cached', async () => {
      const tasks = await Task.find();
      for (const task of tasks) {
        task.title = 'cached title';
        await task.save();
      }
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.listTasksQuery,
          variables: {
            listTasksFilterInput,
          },
        })
        .expect(({ body: { data } }) => {
          const listTasks = data.ListTasks;
          expect(listTasks.totalPages).toBe(1);
          expect(listTasks.page).toBe(1);
          expect(listTasks.pageSize).toBe(2);
          expect(listTasks.totalRecords).toBe(1);
          expect(listTasks.data).toEqual(
            expect.arrayContaining([
              {
                id: 1,
                title: createTaskInput.title,
                description: createTaskInput.description,
              },
            ]),
          );
        })
        .expect(200);
    });
  });

  describe('getTask', () => {
    it('should get the specific task of the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.getTaskQuery,
          variables: {
            id: 1,
          },
        })
        .expect(({ body: { data } }) => {
          const getTask = data.GetTask;
          expect(getTask.id).toBe(1);
          expect(getTask.title).toBe('cached title');
          expect(getTask.description).toBe(createTaskInput.description);
        })
        .expect(200);
    });
  });

  describe('saveTask', () => {
    it('should save the task of the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.saveTaskMutation,
          variables: {
            id: 1,
            saveTaskInput,
          },
        })
        .expect(({ body: { data } }) => {
          const saveTask = data.SaveTask;
          expect(saveTask.id).toBe(1);
          expect(saveTask.title).toBe(saveTaskInput.title);
          expect(saveTask.description).toBe(saveTaskInput.description);
          expect(saveTask.status).toBe(saveTaskInput.status);
        })
        .expect(200);
    });
  });

  describe('deleteTask', () => {
    it('should delete the task of the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .set('Authorization', authBearerToken(userAccessToken))
        .send({
          query: gql.deleteTaskMutation,
          variables: {
            id: 1,
          },
        })
        .expect(({ body: { data } }) => {
          const deleteTask = data.DeleteTask;
          expect(deleteTask).toBe(true);
        })
        .expect(200);
    });
  });
});
