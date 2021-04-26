import * as request from 'supertest';
import { v4 } from 'uuid';
import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/create-workflow-step.input';
import { SaveWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/save-workflow-step.input';
import { getHttpServerTesting, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowStepMutation: `
    mutation CreateWorkflowStep($createWorkflowStepInput: CreateWorkflowStepInput!) {
      CreateWorkflowStep(createWorkflowStepInput: $createWorkflowStepInput) {
        WSID
        WVID
        NAID
      }
    }
  `,
  listWorkflowStepsQuery: `
    query ListWorkflowSteps {
      ListWorkflowSteps {
        WSID
        WVID
        NAID
      }
    }
  `,
  getWorkflowStepQuery: `
    query GetWorkflowStep($id: String!) {
      GetWorkflowStep(id: $id) {
        WSID
        WVID
        NAID
      }
    }
  `,
  saveWorkflowStepMutation: `
    mutation SaveWorkflowStep($id: String!, $saveWorkflowStepInput: SaveWorkflowStepInput!) {
      SaveWorkflowStep(id: $id, saveWorkflowStepInput: $saveWorkflowStepInput) {
        WSID
        WVID
        NAID
        AID
        ACT {
          T
          NM
          MD {
            Name
            Endpoint
          }
          DESIGN {
            id
          }
        }
      }
    }
  `,
  deleteWorkflowStepMutation: `
    mutation DeleteWorkflowStep($id: String!) {
      DeleteWorkflowStep(id: $id)
    }
  `,
};

const createWorkflowStepInput: CreateWorkflowStepInput = {
  WVID: v4(),
  NAID: ['1', '2', '3'],
  AID: v4(),
  ACT: {
    T: 'Web Service',
    NM: 'node_1',
    MD: {
      Endpoint: 'https://google.com',
      Name: 'countries',
    },
    DESIGN: [],
  },
};

const saveWorkflowStepInput: SaveWorkflowStepInput = {
  AID: v4(),
  ACT: {
    T: 'Web Service',
    NM: 'node_1',
    MD: {
      Endpoint: 'https://google.com',
      Name: 'countries',
    },
    DESIGN: [],
  },
};

let getWorkflowStepData: any = {};

describe('WorkflowStepResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowStep', () => {
    it('should create the workflow step', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowStepMutation,
          variables: {
            createWorkflowStepInput,
          },
        })
        .expect(({ body: { data } }) => {
          const createWorkflowStep = data.CreateWorkflowStep;
          expect(createWorkflowStep.WVID).toBe(createWorkflowStepInput.WVID);
          expect(createWorkflowStep.NAID).toEqual(createWorkflowStepInput.NAID);
        })
        .expect(200);
    });
  });

  describe('listWorkflowSteps', () => {
    it('should list the workflow steps', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.listWorkflowStepsQuery,
        })
        .expect(({ body: { data } }) => {
          const listWorkflowSteps = data.ListWorkflowSteps;
          getWorkflowStepData = listWorkflowSteps[0];
          expect(
            listWorkflowSteps.some((workflowStep) => {
              let isSameNAID = true;
              for (const id of createWorkflowStepInput.NAID) {
                if (workflowStep.NAID.includes(id)) continue;
                isSameNAID = false;
              }

              return workflowStep.WVID === createWorkflowStepInput.WVID && isSameNAID;
            }),
          ).toBe(true);
        })
        .expect(200);
    });
  });

  describe('getWorkflowStep', () => {
    it('should get the stepific workflow step', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.getWorkflowStepQuery,
          variables: {
            id: getWorkflowStepData.WSID,
          },
        })
        .expect(({ body: { data } }) => {
          const getWorkflowStep = data.GetWorkflowStep;
          expect(getWorkflowStep.WSID).toBe(getWorkflowStepData.WSID);
          expect(getWorkflowStep.WVID).not.toBe('');
          expect(getWorkflowStep.NAID).not.toBe('');
        })
        .expect(200);
    });
  });

  describe('saveWorkflowStep', () => {
    it('should save the workflow step', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.saveWorkflowStepMutation,
          variables: {
            id: getWorkflowStepData.WSID,
            saveWorkflowStepInput,
          },
        })
        .expect(({ body: { data } }) => {
          const saveWorkflowStep = data.SaveWorkflowStep;
          expect(saveWorkflowStep.WSID).toBe(getWorkflowStepData.WSID);
          expect(saveWorkflowStep.AID).toBe(saveWorkflowStepInput.AID);
          expect(saveWorkflowStep.ACT).toEqual(saveWorkflowStepInput.ACT);
        })
        .expect(200);
    });
  });

  describe('deleteWorkflowStep', () => {
    it('should delete the workflow step', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.deleteWorkflowStepMutation,
          variables: {
            id: getWorkflowStepData.WSID,
          },
        })
        .expect(({ body: { data } }) => {
          const deleteWorkflowStep = data.DeleteWorkflowStep;
          expect(deleteWorkflowStep).toBeNull();
        })
        .expect(200);
    });
  });
});
