import { CompositePrimaryKeyInput } from 'src/graphql/common/inputs/workflow-key.input';
import { CreateWorkflowExecutionInput } from 'src/graphql/workflow-executions/inputs/create-workflow-execution.input';
import { CreateWorkflowVersionInput } from 'src/graphql/workflow-versions/inputs/create-workflow-version.input';
import { v4 } from 'uuid';
import { SaveWorkflowExecutionInput } from '../../src/graphql/workflow-executions/inputs/save-workflow-execution.input';
import { initiateGraphqlRequest, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowVersionMutation: `
    mutation CreateWorkflowVersion($createWorkflowVersionInput: CreateWorkflowVersionInput!){
      CreateWorkflowVersion(createWorkflowVersionInput: $createWorkflowVersionInput) {
        PK
        SK
        WV
        CID
        FAID
        TotalEXC
      }
    }
  `,
  createWorkflowExecutionMutation: `
    mutation CreateWorkflowExecution($createWorkflowExecutionInput:  CreateWorkflowExecutionInput!) {
      CreateWorkflowExecution(createWorkflowExecutionInput: $createWorkflowExecutionInput) {
        PK
        SK
        STE
        WSXH_IDS
      }
    }
  `,
  getWorkflowExecutionBykey: `
    query GetWorkflowExecutionByKey($workflowExecutionKeysInput: CompositePrimaryKeyInput!) {
      GetWorkflowExecutionByKey(workflowExecutionKeysInput: $workflowExecutionKeysInput) {
        PK
        SK
        WSXH_IDS
        STE
      }
    }
  `,
  saveWorkflowExecutionMutation: `
    mutation SavekflowExecution(
      $saveWorkflowExecutionInput: SaveWorkflowExecutionInput!
      $workflowExecutionKeysInput: CompositePrimaryKeyInput!
    ) {
      SaveWorkflowExecution(
        saveWorkflowExecutionInput: $saveWorkflowExecutionInput,
        workflowExecutionKeysInput: $workflowExecutionKeysInput
      ) {
        PK
        SK
        STE
        WSXH_IDS
      }
    }
  `,
  deleteWorkflowExecutionMutation: `
    mutation DeleteWorkflowExecution($workflowExecutionKeysInput: CompositePrimaryKeyInput!){
      DeleteWorkflowExecution(workflowExecutionKeysInput: $workflowExecutionKeysInput)
    }
  `,
};

const OrgId = 'ORG#1234';

const createWorkflowVersionInput: CreateWorkflowVersionInput = {
  WLFID: `${OrgId}|WLF#1`,
  WV: '1',
  FAID: '[1, 2, 3]',
  CID: v4(),
};

const createWorkflowExecutionInput: CreateWorkflowExecutionInput = {
  WorkflowVersionKeys: { PK: '', SK: '' },
  WSXH_IDS: ['WSXH#1'],
  STE: '{}',
  PARALLEL: [],
};

const workflowExecutionKeysInput: CompositePrimaryKeyInput = {
  PK: '',
  SK: '',
};

const saveWorkflowExecutionInput: SaveWorkflowExecutionInput = {
  STE: '{ result: good }',
};

describe('WorkflowExecutionResolver (e2e)', () => {
  let workflowVersion: any;

  beforeAll(async () => {
    await setUpTesting();
    const data = await initiateGraphqlRequest(gql.createWorkflowVersionMutation, { createWorkflowVersionInput });
    workflowVersion = data.CreateWorkflowVersion;

    createWorkflowExecutionInput.WorkflowVersionKeys.PK = workflowVersion.PK;
    createWorkflowExecutionInput.WorkflowVersionKeys.SK = workflowVersion.SK;
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowExecution', () => {
    it('should create the workflow execution', async () => {
      const data = await initiateGraphqlRequest(gql.createWorkflowExecutionMutation, { createWorkflowExecutionInput });
      const workflowExec = data.CreateWorkflowExecution;

      expect(workflowExec.PK).toEqual(`${workflowVersion.SK}|WX#1`);
      expect(workflowExec.SK).toEqual('WX#1');
      expect(workflowExec.STE).toEqual(createWorkflowExecutionInput.STE);
      expect(workflowExec.WSXH_IDS).toEqual(createWorkflowExecutionInput.WSXH_IDS);

      workflowExecutionKeysInput.PK = workflowExec.PK;
      workflowExecutionKeysInput.SK = workflowExec.SK;
    });
  });

  describe('GetWorkflowExecutionByKey', () => {
    it('should get the specific workflow execution', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowExecutionBykey, { workflowExecutionKeysInput });
      const workflowExec = data.GetWorkflowExecutionByKey;

      expect(workflowExec.PK).toEqual(`${workflowVersion.SK}|WX#1`);
      expect(workflowExec.SK).toEqual('WX#1');
      expect(workflowExec.STE).toEqual(createWorkflowExecutionInput.STE);
      expect(workflowExec.WSXH_IDS).toEqual(createWorkflowExecutionInput.WSXH_IDS);
    });
  });

  describe('saveWorkflowExecution', () => {
    it('should save the workflow execution', async () => {
      const data = await initiateGraphqlRequest(gql.saveWorkflowExecutionMutation, {
        workflowExecutionKeysInput,
        saveWorkflowExecutionInput,
      });
      const workflowExec = data.SaveWorkflowExecution;

      expect(workflowExec.STE).not.toEqual(createWorkflowExecutionInput.STE);
      expect(workflowExec.STE).toEqual(saveWorkflowExecutionInput.STE);
    });
  });

  describe('deleteWorkflowExecution', () => {
    it('should delete the workflow execution', async () => {
      const data1 = await initiateGraphqlRequest(gql.deleteWorkflowExecutionMutation, { workflowExecutionKeysInput });
      expect(data1.DeleteWorkflowExecution).toBeNull();

      const data2 = await initiateGraphqlRequest(gql.getWorkflowExecutionBykey, { workflowExecutionKeysInput });
      expect(data2.GetWorkflowExecutionByKey).toBeNull();
    });
  });
});
