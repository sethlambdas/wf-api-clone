import * as request from 'supertest';
import { v4 } from 'uuid';
import { ConfigUtil } from '../../src/utils/config.util';
import { getHttpServerTesting, removeDynamoTable, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowSpecMutation: `
    mutation CreateWorkflowSpec($createWorkflowSpecInput: CreateWorkflowSpecInput!) {
      CreateWorkflowSpec(createWorkflowSpecInput: $createWorkflowSpecInput) {
        WSID
        WVID
        NAID
      }
    }
  `,
  listWorkflowSpecsQuery: `
    query ListWorkflowSpecs {
      ListWorkflowSpecs {
        WSID
        WVID
        NAID
      }
    }
  `,
  getWorkflowSpecQuery: `
    query GetWorkflowSpec($id: String!) {
      GetWorkflowSpec(id: $id) {
        WSID
        WVID
        NAID
      }
    }
  `,
  saveWorkflowSpecMutation: `
    mutation SaveWorkflowSpec($id: String!, $saveWorkflowSpecInput: SaveWorkflowSpecInput!) {
      SaveWorkflowSpec(id: $id, saveWorkflowSpecInput: $saveWorkflowSpecInput) {
        WSID
        WVID
        NAID
        AID
        ACT
      }
    }
  `,
  deleteWorkflowSpecMutation: `
    mutation DeleteWorkflowSpec($id: String!) {
      DeleteWorkflowSpec(id: $id)
    }
  `,
};

const createWorkflowSpecInput = {
  WVID: v4(),
  NAID: '[1, 2, 3]',
  AID: v4(),
  ACT: '{}',
};

const saveWorkflowSpecInput = {
  AID: v4(),
  ACT: '{ T: "WebSrv" }',
};

let getWorkflowSpecData: any = {};

describe('WorkflowSpecResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
    // await removeDynamoTable(ConfigUtil.get('dynamodb.schema.workflowSpecs'));
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowSpec', () => {
    it('should create the workflow spec', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowSpecMutation,
          variables: {
            createWorkflowSpecInput,
          },
        })
        .expect(({ body: { data } }) => {
          const createWorkflowSpec = data.CreateWorkflowSpec;
          expect(createWorkflowSpec.WVID).toBe(createWorkflowSpecInput.WVID);
          expect(createWorkflowSpec.NAID).toBe(createWorkflowSpecInput.NAID);
        })
        .expect(200);
    });
  });

  describe('listWorkflowSpecs', () => {
    it('should list the workflow specs', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.listWorkflowSpecsQuery,
        })
        .expect(({ body: { data } }) => {
          const listWorkflowSpecs = data.ListWorkflowSpecs;
          getWorkflowSpecData = listWorkflowSpecs[0];
          expect(
            listWorkflowSpecs.some((workflowSpec) => {
              return (
                workflowSpec.WVID === createWorkflowSpecInput.WVID && workflowSpec.NAID === createWorkflowSpecInput.NAID
              );
            }),
          ).toBe(true);
        })
        .expect(200);
    });
  });

  describe('getWorkflowSpec', () => {
    it('should get the specific workflow spec', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.getWorkflowSpecQuery,
          variables: {
            id: getWorkflowSpecData.WSID,
          },
        })
        .expect(({ body: { data } }) => {
          const getWorkflowSpec = data.GetWorkflowSpec;
          expect(getWorkflowSpec.WSID).toBe(getWorkflowSpecData.WSID);
          expect(getWorkflowSpec.WVID).not.toBe('');
          expect(getWorkflowSpec.NAID).not.toBe('');
        })
        .expect(200);
    });
  });

  describe('saveWorkflowSpec', () => {
    it('should save the workflow spec', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.saveWorkflowSpecMutation,
          variables: {
            id: getWorkflowSpecData.WSID,
            saveWorkflowSpecInput,
          },
        })
        .expect(({ body: { data } }) => {
          const saveWorkflowSpec = data.SaveWorkflowSpec;
          expect(saveWorkflowSpec.WSID).toBe(getWorkflowSpecData.WSID);
          expect(saveWorkflowSpec.AID).toBe(saveWorkflowSpecInput.AID);
          expect(saveWorkflowSpec.ACT).toBe(saveWorkflowSpecInput.ACT);
        })
        .expect(200);
    });
  });

  describe('deleteWorkflowSpec', () => {
    it('should delete the workflow spec', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.deleteWorkflowSpecMutation,
          variables: {
            id: getWorkflowSpecData.WSID,
          },
        })
        .expect(({ body: { data } }) => {
          const deleteWorkflowSpec = data.DeleteWorkflowSpec;
          expect(deleteWorkflowSpec).toBeNull();
        })
        .expect(200);
    });
  });
});
