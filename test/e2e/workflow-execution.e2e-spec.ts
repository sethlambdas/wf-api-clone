import * as request from 'supertest';
import { v4 } from 'uuid';
import { SaveWorkflowExecutionInput } from '../../src/graphql/workflow-executions/inputs/save-workflow-execution.input';
import { getHttpServerTesting, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowExecutionMutation: `
    mutation CreateWorkflowExecution($createWorkflowExecutionInput: CreateWorkflowExecutionInput!) {
      CreateWorkflowExecution(createWorkflowExecutionInput: $createWorkflowExecutionInput) {
        WXID
        WSID
        CAT {
          T
          NM
          Status
          MD {
            Email
            Subject
            Body
            Name
            Endpoint
          }
        }
      }
    }
  `,
  listWorkflowExecutionsQuery: `
    query ListWorkflowExecutions {
      ListWorkflowExecutions {
        WXID
        WSID
        CAT {
          T
          NM
          Status
          MD {
            Email
            Subject
            Body
            Name
            Endpoint
          }
        }
      }
    }
  `,
  getWorkflowExecutionQuery: `
    query GetWorkflowExecution($id: String!) {
      GetWorkflowExecution(id: $id) {
        WXID
        WSID
        CAT {
          T
          NM
          Status
          MD {
            Email
            Subject
            Body
            Name
            Endpoint
          }
        }
      }
    }
  `,
  saveWorkflowExecutionMutation: `
    mutation SaveWorkflowExecution($id: String!, $saveWorkflowExecutionInput: SaveWorkflowExecutionInput!) {
      SaveWorkflowExecution(id: $id, saveWorkflowExecutionInput: $saveWorkflowExecutionInput) {
        WXID
        WSID
        CAT {
          T
          Status
        }
        STE
      }
    }
  `,
  deleteWorkflowExecutionMutation: `
    mutation DeleteWorkflowExecution($id: String!) {
      DeleteWorkflowExecution(id: $id)
    }
  `,
};

const createWorkflowExecutionInput = {
  WSID: v4(),
  CAT: [],
  STE: '{}',
};

const saveWorkflowExecutionInput: SaveWorkflowExecutionInput = {
  CAT: [{ T: 'WebSrv', Status: 'Finished' }],
  STE: '{ data: [] }',
};

let getWorkflowExecutionData: any = {};

describe('WorkflowExecutionResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowExecution', () => {
    it('should create the workflow execution', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowExecutionMutation,
          variables: {
            createWorkflowExecutionInput,
          },
        })
        .expect(({ body: { data } }) => {
          const createWorkflowExecution = data.CreateWorkflowExecution;
          expect(createWorkflowExecution.WSID).toBe(createWorkflowExecutionInput.WSID);
          expect(createWorkflowExecution.CAT).toStrictEqual(createWorkflowExecutionInput.CAT);
        })
        .expect(200);
    });
  });

  describe('listWorkflowExecutions', () => {
    it('should list the workflow executions', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.listWorkflowExecutionsQuery,
        })
        .expect(({ body: { data } }) => {
          const listWorkflowExecutions = data.ListWorkflowExecutions;
          getWorkflowExecutionData = listWorkflowExecutions[0];
          expect(
            listWorkflowExecutions.some((workflowExecution) => {
              let isSameCAT = true;
              for (const id of createWorkflowExecutionInput.CAT) {
                if (workflowExecution.CAT.includes(id)) continue;
                isSameCAT = false;
              }

              return workflowExecution.WSID === createWorkflowExecutionInput.WSID && isSameCAT;
            }),
          ).toBe(true);
        })
        .expect(200);
    });
  });

  describe('getWorkflowExecution', () => {
    it('should get the executionific workflow execution', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.getWorkflowExecutionQuery,
          variables: {
            id: getWorkflowExecutionData.WXID,
          },
        })
        .expect(({ body: { data } }) => {
          const getWorkflowExecution = data.GetWorkflowExecution;
          expect(getWorkflowExecution.WXID).toBe(getWorkflowExecutionData.WXID);
          expect(getWorkflowExecution.WSID).not.toBe('');
          expect(getWorkflowExecution.CAT).not.toBe('');
        })
        .expect(200);
    });
  });

  describe('saveWorkflowExecution', () => {
    it('should save the workflow execution', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.saveWorkflowExecutionMutation,
          variables: {
            id: getWorkflowExecutionData.WXID,
            saveWorkflowExecutionInput,
          },
        })
        .expect(({ body: { data } }) => {
          const saveWorkflowExecution = data.SaveWorkflowExecution;
          expect(saveWorkflowExecution.WXID).toBe(getWorkflowExecutionData.WXID);
          expect(saveWorkflowExecution.STE).toBe(saveWorkflowExecutionInput.STE);
          for (const cat of saveWorkflowExecutionInput.CAT) expect(saveWorkflowExecution.CAT[0]).toEqual(cat);
        })
        .expect(200);
    });
  });

  describe('deleteWorkflowExecution', () => {
    it('should delete the workflow execution', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.deleteWorkflowExecutionMutation,
          variables: {
            id: getWorkflowExecutionData.WXID,
          },
        })
        .expect(({ body: { data } }) => {
          const deleteWorkflowExecution = data.DeleteWorkflowExecution;
          expect(deleteWorkflowExecution).toBeNull();
        })
        .expect(200);
    });
  });
});
