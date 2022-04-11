import { initiateGraphqlRequest, setUpTesting, tearDownTesting } from '../test-e2e';

import { CompositePrimaryKeyInput } from '../../src/graphql/common/inputs/workflow-key.input';
import { CreateWorkflowInput } from '../../src/graphql/workflow/inputs/post.inputs';
import { CreateWorkflowResponse } from '../../src/graphql/workflow/workflow.entity';

import { CreateWorkflowStepExecutionHistoryInput } from '../../src/graphql/workflow-steps-executions-history/inputs/post.inputs';
import { ListAllManualApprovalInput } from '../../src/graphql/workflow-steps-executions-history/inputs/get.inputs';
import { SaveWorkflowStepExecutionHistoryInput } from '../../src/graphql/workflow-steps-executions-history/inputs/put.inputs';

const gql = {
  CreateOrganization: `
    mutation CreateOrganization($createOrganizationInput: CreateOrganizationInput!) {
      CreateOrganization(createOrganizationInput: $createOrganizationInput) {
        PK
      }
    }
  `,
  createWorkflowMutation: `
    mutation CreateWorkflow($createWorkflowInput: CreateWorkflowInput!) {
      CreateWorkflow(createWorkflowInput: $createWorkflowInput) {
        WorkflowKeys {
          PK
          SK
        }
        WorkflowVersionKeys {
          PK
          SK
        }
        IsWorkflowNameExist
        Error
      }
    }
  `,
  createWorkflowStepExecutionHistoryMutation: `
    mutation createWorkflowStepExecutionHistory(
      $createWorkflowStepExecutionHistoryInput: CreateWorkflowStepExecutionHistoryInput!
    ) {
      CreateWorkflowStepExecutionHistory(
        createWorkflowStepExecutionHistoryInput: $createWorkflowStepExecutionHistoryInput
      ) {
        PK
        SK
        WLFN
        WSID
        Status
        END
      }
    }
  `,
  getWorkflowStepExecutionHistoryByKey: `
    query GetWorkflowStepExecutionHistoryByKey(
      $workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput!
    ) {
      GetWorkflowStepExecutionHistoryByKey(
        workflowStepExecutionHistoryKeyInput: $workflowStepExecutionHistoryKeyInput
      ) {
        PK
        SK
        WLFN
        WSID
        Status
        END
      }
    }
  `,
  saveWorkflowStepExecutionHistory: `
    mutation SaveWorkflowStepExecutionHistory(
      $workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput!
      $saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput!
    ) {
      SaveWorkflowStepExecutionHistory(
        workflowStepExecutionHistoryKeyInput: $workflowStepExecutionHistoryKeyInput,
        saveWorkflowStepExecutionHistoryInput: $saveWorkflowStepExecutionHistoryInput
      ) {
        PK
        SK
        WLFN
        WSID
        Status
        END
      }
    }
  `,
  deleteWorkflowStepExecutionHistory: `
    mutation DeleteWorkflowStepExecutionHistory(
      $workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput!
    ) {
      DeleteWorkflowStepExecutionHistory(
        workflowStepExecutionHistoryKeyInput: $workflowStepExecutionHistoryKeyInput
      ) 
    }
  `,
  listAllManualApprovalBasedOnStatus: `
    query ListAllManualApprovalBasedOnStatus($listAllManualApprovalInput: ListAllManualApprovalInput!) {
      ListAllManualApprovalBasedOnStatus(listAllManualApprovalInput: $listAllManualApprovalInput) {
        ManualApprovals {
          WorkflowExecutionKeys {
            PK
            SK
          }
          WorkflowStepKeys {
            PK
            SK
          }
          WorkflowStepExecutionHistorySK
          WorkflowName
          WorkflowVersion
        }
        LastKey
        TotalRecords
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
  listWorkflowStepExecutionHistoryOfAnExecution: `
    query ListWorkflowStepExecutionHistoryOfAnExecution(
      $listWorkflowStepExecutionHistoryOfAnExecutionInput: ListWorkflowStepExecutionHistoryOfAnExecutionInput!
    ) {
      ListWorkflowStepExecutionHistoryOfAnExecution(
        listWorkflowStepExecutionHistoryOfAnExecutionInput: $listWorkflowStepExecutionHistoryOfAnExecutionInput
      ) {
        WorkflowStepExecutionHistory {
          PK
          SK
          T
          NM
          Status
          WLFN
        }
        TotalRecords
      }
    }
  `,
};

const WorkflowName = 'TestWorkflowName';

let workflowExecutionPK = '';

const createWorkflowStepExecutionHistoryInput: CreateWorkflowStepExecutionHistoryInput = {
  T: 'Email',
  NM: 'node_0',
  MD: { Email: 'test@email.com' },
  OrgId: 'ORG#1234',
  PK: 'WV#1234|WX1',
  WorkflowStepSK: 'WS#1234',
  WLFN: WorkflowName,
  Status: 'Started',
  UQ_OVL: 'Started',
};

const workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput = {
  PK: '',
  SK: '',
};

const saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput = {
  Status: 'Finished',
};

const createWorkflowInput: CreateWorkflowInput = {
  OrgId: 'ORG#1234',
  WorkflowName,
  StartAt: 'node_1',
  States: [
    {
      ActivityId: 'node_1',
      ActivityType: 'Web Service',
      NextActivities: ['node_2'],
      Variables: {
        Email: 'marco@lambdas.io',
        Endpoint: 'https://restcountries.eu/rest/v2/name/Philippines',
        Name: 'countries',
      },
    },
    {
      ActivityId: 'node_2',
      ActivityType: 'Email',
      End: true,
      Variables: {
        Email: 'test@email.com',
        Subject: 'Testing',
        Body: 'Message here',
      },
    },
  ],
};

const listAllManualApprovalInput: ListAllManualApprovalInput = {
  OrgId: 'ORG#1234',
  Status: 'Started',
  pageSize: 2,
  page: 1,
};

let getWorkflow: CreateWorkflowResponse = {};

describe('WorkflowStepExecutionHistoryResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowStepExecutionHistory', () => {
    it('should create the workflow step execution history', async () => {
      const data = await initiateGraphqlRequest(gql.createWorkflowStepExecutionHistoryMutation, {
        createWorkflowStepExecutionHistoryInput,
      });
      const workflowStepExecHistory = data.CreateWorkflowStepExecutionHistory;

      expect(workflowStepExecHistory.PK).toEqual(createWorkflowStepExecutionHistoryInput.PK);
      expect(workflowStepExecHistory.WLFN).toEqual(createWorkflowStepExecutionHistoryInput.WLFN);
      expect(workflowStepExecHistory.WSID).toEqual(createWorkflowStepExecutionHistoryInput.WorkflowStepSK);
      expect(workflowStepExecHistory.Status).toEqual(createWorkflowStepExecutionHistoryInput.Status);

      workflowStepExecutionHistoryKeyInput.PK = workflowStepExecHistory.PK;
      workflowStepExecutionHistoryKeyInput.SK = workflowStepExecHistory.SK;
    });
  });

  describe('getWorkflowStepExecutionHistoryByKey', () => {
    it('should get specific workflow step execution history', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowStepExecutionHistoryByKey, {
        workflowStepExecutionHistoryKeyInput,
      });
      const workflowStepExecHistory = data.GetWorkflowStepExecutionHistoryByKey;

      expect(workflowStepExecHistory.PK).toEqual(createWorkflowStepExecutionHistoryInput.PK);
      expect(workflowStepExecHistory.WLFN).toEqual(createWorkflowStepExecutionHistoryInput.WLFN);
      expect(workflowStepExecHistory.WSID).toEqual(createWorkflowStepExecutionHistoryInput.WorkflowStepSK);
      expect(workflowStepExecHistory.Status).toEqual(createWorkflowStepExecutionHistoryInput.Status);
    });
  });

  describe('saveWorkflowStepExecutionHistory', () => {
    it('should save the workflow step execution history', async () => {
      const data = await initiateGraphqlRequest(gql.saveWorkflowStepExecutionHistory, {
        workflowStepExecutionHistoryKeyInput,
        saveWorkflowStepExecutionHistoryInput,
      });
      const workflowStepExecHistory = data.SaveWorkflowStepExecutionHistory;

      expect(workflowStepExecHistory.Status).toEqual(saveWorkflowStepExecutionHistoryInput.Status);
    });
  });

  describe('deleteWorkflowStepExecutionHistory', () => {
    it('should delete the workflow step execution history', async () => {
      const data1 = await initiateGraphqlRequest(gql.deleteWorkflowStepExecutionHistory, {
        workflowStepExecutionHistoryKeyInput,
      });
      expect(data1.DeleteWorkflowStepExecutionHistory).toBeNull();

      const data2 = await initiateGraphqlRequest(gql.getWorkflowStepExecutionHistoryByKey, {
        workflowStepExecutionHistoryKeyInput,
      });
      expect(data2.GetWorkflowStepExecutionHistoryByKey).toBeNull();
    });
  });

  describe('ListAllManualApprovalBasedOnStatus', () => {
    const OrgId = 'ORG#2a61005c-9269-432e-9c78-980f0ce6415f';
    let workflow: any;

    const wsxh1 = { ...createWorkflowStepExecutionHistoryInput, T: 'Manual Approval' };
    const wsxh2 = { ...createWorkflowStepExecutionHistoryInput, T: 'Manual Approval' };

    beforeAll(async () => {
      createWorkflowInput.OrgId = OrgId;
      listAllManualApprovalInput.OrgId = OrgId;
      wsxh1.OrgId = OrgId;
      wsxh2.OrgId = OrgId;

      // Create Workflow
      const data2 = await initiateGraphqlRequest(gql.createWorkflowMutation, { createWorkflowInput });
      workflow = data2.CreateWorkflow;

      getWorkflow = workflow;

      if (data2.CreateWorkflow?.IsWorkflowNameExist) {
        expect(data2.CreateWorkflow.WorkflowKeys).toBeNull();
        expect(data2.CreateWorkflow.WorkflowVersionKeys).toBeNull();
        return;
      }

      wsxh1.PK = `${workflow.WorkflowVersionKeys.SK}|WX#1`;
      wsxh2.PK = `${workflow.WorkflowVersionKeys.SK}|WX#1`;
      workflowExecutionPK = `${workflow.WorkflowVersionKeys.SK}|WX#1`;

      // Create Workflow Step Execution History
      await initiateGraphqlRequest(gql.createWorkflowStepExecutionHistoryMutation, {
        createWorkflowStepExecutionHistoryInput: wsxh1,
      });
      await initiateGraphqlRequest(gql.createWorkflowStepExecutionHistoryMutation, {
        createWorkflowStepExecutionHistoryInput: wsxh2,
      });
    });

    it('should list all manual approval step execution history', async () => {
      const data = await initiateGraphqlRequest(gql.listAllManualApprovalBasedOnStatus, { listAllManualApprovalInput });
      const wlfStepExecHistory = data.ListAllManualApprovalBasedOnStatus;

      expect(wlfStepExecHistory.ManualApprovals.length).toEqual(2);
      expect(wlfStepExecHistory.TotalRecords).toEqual(2);
    });
  });

  describe('listWorkflowStepExecutionHistoryOfAnExecution', () => {
    it('should list workflow step execution histories of an execution', async () => {
      if (!workflowExecutionPK) return;

      const data = await initiateGraphqlRequest(gql.listWorkflowStepExecutionHistoryOfAnExecution, {
        listWorkflowStepExecutionHistoryOfAnExecutionInput: { workflowExecutionPK },
      });

      const { WorkflowStepExecutionHistory, TotalRecords } = data.ListWorkflowStepExecutionHistoryOfAnExecution;

      expect(WorkflowStepExecutionHistory).not.toBeUndefined();
      expect(WorkflowStepExecutionHistory.length).toEqual(2);
      expect(TotalRecords).toEqual(2);
    });
  });
});
