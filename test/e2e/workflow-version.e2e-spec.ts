import { HttpStatus } from '@nestjs/common';
import * as faker from 'faker';
import * as request from 'supertest';
import { SortDir } from '../../src/graphql/common/enums/sort-dir.enum';
import { WorkflowVersion } from '../../src/graphql/workflow-versions/workflow-version.entity';
import { ConfigUtil } from '../../src/utils/config.util';
import {
  authBearerToken,
  dataTesting,
  getHttpServerTesting,
  removeDynamoTable,
  setUpTesting,
  tearDownTesting,
} from '../test-e2e';

const gql = {
  createWorkflowVersionMutation: `
    mutation CreateWorkflowVersion($createWorkflowVersionInput: CreateWorkflowVersionInput!) {
      CreateWorkflowVersion(createWorkflowVersionInput: $createWorkflowVersionInput) {
        WVID
        CID
        WID
      }
    }
  `,
  listWorkflowVersionsQuery: `
    query ListWorkflowVersions {
      ListWorkflowVersions {
        WVID
        CID
        WID
      }
    }
  `,
  getWorkflowVersionQuery: `
    query GetWorkflowVersion($id: String!) {
      GetWorkflowVersion(id: $id) {
        WVID
        CID
        WID
      }
    }
  `,
  saveWorkflowVersionMutation: `
    mutation SaveWorkflowVersion($id: String!, $saveWorkflowVersionInput: SaveWorkflowVersionInput!) {
      SaveWorkflowVersion(id: $id, saveWorkflowVersionInput: $saveWorkflowVersionInput) {
        WVID
        CID
        WID
        WV
        FAID
      }
    }
  `,
  deleteWorkflowVersionMutation: `
    mutation DeleteWorkflowVersion($id: String!) {
      DeleteWorkflowVersion(id: $id)
    }
  `,
};

const createWorkflowVersionInput = {
  CID: '5252',
  WID: '321',
  WV: '',
  FAID: '',
};

const saveWorkflowVersionInput = {
  WV: '123',
  FAID: '321',
};

let getWorkflowVersionData: any = {};

describe('WorkflowVersionResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
    await removeDynamoTable(ConfigUtil.get('dynamodb.schema.workflowVersions'));
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowVersion', () => {
    it('should create the workflow version', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowVersionMutation,
          variables: {
            createWorkflowVersionInput,
          },
        })
        .expect(({ body: { data } }) => {
          const createWorkflowVersion = data.CreateWorkflowVersion;
          expect(createWorkflowVersion.CID).toBe(createWorkflowVersionInput.CID);
          expect(createWorkflowVersion.WID).toBe(createWorkflowVersionInput.WID);
        })
        .expect(200);
    });
  });

  describe('listWorkflowVersions', () => {
    it('should list the workflow versions', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.listWorkflowVersionsQuery,
        })
        .expect(({ body: { data } }) => {
          const listWorkflowVersions = data.ListWorkflowVersions;
          getWorkflowVersionData = listWorkflowVersions[0];
          expect(
            listWorkflowVersions.some((workflowVersion) => {
              return (
                workflowVersion.CID === createWorkflowVersionInput.CID &&
                workflowVersion.WID === createWorkflowVersionInput.WID
              );
            }),
          ).toBe(true);
        })
        .expect(200);
    });
  });

  describe('getWorkflowVersion', () => {
    it('should get the specific workflow version', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.getWorkflowVersionQuery,
          variables: {
            id: getWorkflowVersionData.WVID,
          },
        })
        .expect(({ body: { data } }) => {
          const getWorkflowVersion = data.GetWorkflowVersion;
          expect(getWorkflowVersion.WVID).toBe(getWorkflowVersionData.WVID);
          expect(getWorkflowVersion.CID).not.toBe('');
          expect(getWorkflowVersion.WID).not.toBe('');
        })
        .expect(200);
    });
  });

  describe('saveWorkflowVersion', () => {
    it('should save the workflow version', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.saveWorkflowVersionMutation,
          variables: {
            id: getWorkflowVersionData.WVID,
            saveWorkflowVersionInput,
          },
        })
        .expect(({ body: { data } }) => {
          const saveWorkflowVersion = data.SaveWorkflowVersion;
          expect(saveWorkflowVersion.WVID).toBe(getWorkflowVersionData.WVID);
          expect(saveWorkflowVersion.WV).toBe(saveWorkflowVersionInput.WV);
          expect(saveWorkflowVersion.FAID).toBe(saveWorkflowVersionInput.FAID);
        })
        .expect(200);
    });
  });

  describe('deleteWorkflowVersion', () => {
    it('should delete the workflow version', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.deleteWorkflowVersionMutation,
          variables: {
            id: getWorkflowVersionData.WVID,
          },
        })
        .expect(({ body: { data } }) => {
          const deleteWorkflowVersion = data.DeleteWorkflowVersion;
          expect(deleteWorkflowVersion).toBeNull();
        })
        .expect(200);
    });
  });
});
