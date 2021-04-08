import { HttpStatus } from '@nestjs/common';
import * as faker from 'faker';
import * as request from 'supertest';
import { SortDir } from '../../src/graphql/common/enums/sort-dir.enum';
import { WorkflowVersion } from '../../src/graphql/workflow-versions/workflow-version.entity';
import { ConfigUtil } from '../../src/utils/config.util';
import { authBearerToken, dataTesting, getHttpServerTesting, removeDynamoTable, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowVersionMutation: `
    mutation CreateWorkflowVersion($createWorkflowVersionInput: CreateWorkflowVersionInput!) {
      CreateWorkflowVersion(createWorkflowVersionInput: $createWorkflowVersionInput) {
        CID
        WID
      }
    }
  `,
  listWorkflowVersionsQuery: `
    query ListWorkflowVersions {
      ListWorkflowVersions {
        CID
        WID
      }
    }
  `,
};

const createWorkflowVersionInput = {
  CID: '5252',
  WID: '321',
};

describe('WorkflowVersionResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
    await removeDynamoTable(ConfigUtil.get('aws.dynamodb.schema.workflowVersions'));
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
          console.log(createWorkflowVersion);
          // expect(createWorkflowVersion.id).toBe(1);
          // expect(createWorkflowVersion.title).toBe(createWorkflowVersionInput.title);
          // expect(createWorkflowVersion.description).toBe(createWorkflowVersionInput.description);
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
          console.log(listWorkflowVersions);
        })
        .expect(200);
    });
  });
});
