import { CompositePrimaryKeyInput } from '../../src/graphql/common/inputs/workflow-key.input';
import { CreateOrganizationInput } from '../../src/graphql/organizations/inputs/create-organization.input';
import { CreateWorkflowExecutionInput } from '../../src/graphql/workflow-executions/inputs/create-workflow-execution.input';
import { CreateWorkflowStepExecutionHistoryInput } from '../../src/graphql/workflow-steps-executions-history/inputs/create.input';
import { ListAllManualApprovalInput } from '../../src/graphql/workflow-steps-executions-history/inputs/get-all-approval.input';
import { ListWorkflowStepExecutionHistoryOfAnExecutionInput } from '../../src/graphql/workflow-steps-executions-history/inputs/list-workflow-execution-step-history-of-execution.input';
import { SaveWorkflowStepExecutionHistoryInput } from '../../src/graphql/workflow-steps-executions-history/inputs/save.input';
import { CreateWorkflowInput } from '../../src/graphql/workflow/inputs/create-workflow.input';
import { CreateWorkflowResponse } from '../../src/graphql/workflow/workflow.entity';
import { initiateGraphqlRequest, setUpTesting, tearDownTesting } from '../test-e2e';

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
};

const workflowStepExecutionHistoryKeyInput: CompositePrimaryKeyInput = {
  PK: '',
  SK: '',
};

const saveWorkflowStepExecutionHistoryInput: SaveWorkflowStepExecutionHistoryInput = {
  Status: 'Finished',
};

const createOrganizationInput: CreateOrganizationInput = {
  orgName: 'TestOrgName',
};

const createWorkflowInput: CreateWorkflowInput = {
  OrgId: 'Will Change After Create Organization Test Execute',
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
  OrgId: '',
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
    let OrgId = '';
    let workflow: any;

    const wsxh1 = { ...createWorkflowStepExecutionHistoryInput, T: 'Manual Approval' };
    const wsxh2 = { ...createWorkflowStepExecutionHistoryInput, T: 'Manual Approval' };

    beforeAll(async () => {
      // Create Organization
      const data1 = await initiateGraphqlRequest(gql.CreateOrganization, { createOrganizationInput });
      OrgId = data1.CreateOrganization.PK;

      createWorkflowInput.OrgId = OrgId;
      listAllManualApprovalInput.OrgId = OrgId;
      wsxh1.OrgId = OrgId;
      wsxh2.OrgId = OrgId;

      // Create Workflow
      const data2 = await initiateGraphqlRequest(gql.createWorkflowMutation, { createWorkflowInput });
      workflow = data2.CreateWorkflow;

      getWorkflow = workflow;

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
      const data = await initiateGraphqlRequest(gql.listWorkflowStepExecutionHistoryOfAnExecution, {
        listWorkflowStepExecutionHistoryOfAnExecutionInput: { workflowExecutionPK },
      });
  
      const { WorkflowStepExecutionHistory, TotalRecords } =
        data.ListWorkflowStepExecutionHistoryOfAnExecution;
  
      expect(WorkflowStepExecutionHistory).not.toBeUndefined();
      expect(WorkflowStepExecutionHistory.length).toEqual(2);
      expect(TotalRecords).toEqual(2);
    });
  });
});
